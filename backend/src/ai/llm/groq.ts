import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { LlmProvider, StructuredRequest, TextRequest } from "@/ai/llm/provider.ts";
import { withRetry, parseRetryAfterMs } from "@/ai/llm/retry.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
import { logger } from "@/shared/logger.ts";
import { AppError } from "@/shared/errors.ts";

const log = logger.child("groq");

/**
 * Minimal concurrency gate. Groq's free tier rate-limits aggressively, so we cap
 * simultaneous in-flight requests (the 5 specialist agents otherwise fire at
 * once). Combined with withRetry's backoff this keeps the pipeline stable.
 */
class Semaphore {
  private active = 0;
  private queue: (() => void)[] = [];
  constructor(private readonly max: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.queue.shift()?.();
    }
  }
}

// Serialize calls: Groq free tier is token-per-minute limited, and bursts from
// the 5 parallel agents trip the limit. Serializing smooths usage.
const gate = new Semaphore(1);

/**
 * Groq provider. Groq exposes an OpenAI-compatible API, so we drive it through
 * LangChain's ChatOpenAI with a custom baseURL. Structured outputs use
 * function/tool calling (supported by llama-3.3-70b-versatile and similar).
 */
export class GroqProvider implements LlmProvider {
  readonly name = "groq";
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseURL: string;

  constructor(apiKey: string, baseURL: string, model: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.model = model;
  }

  private chat(temperature: number) {
    return new ChatOpenAI({
      apiKey: this.apiKey,
      model: this.model,
      temperature,
      maxRetries: 0, // retries handled by withRetry
      timeout: 45_000, // fail fast so withRetry can recover instead of hanging
      maxTokens: 2048,
      configuration: { baseURL: this.baseURL },
    });
  }

  async generateStructured<T>(req: StructuredRequest<T>): Promise<T> {
    // llama-3.3 supports tool/function calling (not json_schema) and sometimes
    // drifts on nested shapes. We run a self-correcting loop: on a schema/parse
    // failure we feed the exact validation error back to the model so it repairs
    // its own output. Rate-limit (429) errors wait per the provider's hint.
    const model = this.chat(req.temperature ?? 0.4).withStructuredOutput(req.schema, {
      name: req.schemaName,
    });
    const system = `${req.system}\n\nReturn data via the ${req.schemaName} tool, matching its JSON schema EXACTLY: every required field present, correct types, and arrays containing the specified element type (objects vs strings).`;

    const maxAttempts = 5;
    const maxRateLimitWaits = 6;
    let rateLimitWaits = 0;
    let lastErr: unknown;
    let correction = "";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const human = correction
          ? `${req.prompt}\n\nYour previous response failed validation:\n${correction}\nReturn a corrected response that strictly matches the schema.`
          : req.prompt;
        return (await gate.run(() =>
          model.invoke([new SystemMessage(system), new HumanMessage(human)]),
        )) as T;
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        const wait = parseRetryAfterMs(e);
        if (wait && rateLimitWaits < maxRateLimitWaits) {
          // Rate limited: wait the hinted window, don't consume a correction.
          rateLimitWaits++;
          await sleep(wait);
          attempt--;
          continue;
        }
        correction = msg.slice(0, 600);
        log.warn("structured_retry", { schema: req.schemaName, attempt: attempt + 1 });
        await sleep(300);
      }
    }

    log.error("structured_failed", {
      schema: req.schemaName,
      message: lastErr instanceof Error ? lastErr.message : String(lastErr),
    });
    throw AppError.upstream(`Groq structured generation failed for ${req.schemaName}`);
  }

  async generateText(req: TextRequest): Promise<string> {
    const model = this.chat(req.temperature ?? 0.5);
    try {
      const res = await withRetry(
        () =>
          gate.run(() =>
            model.invoke([new SystemMessage(req.system), new HumanMessage(req.prompt)]),
          ),
        { label: "groq:text" },
      );
      return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    } catch (e) {
      log.error("text_failed", { message: e instanceof Error ? e.message : String(e) });
      throw AppError.upstream("Groq text generation failed");
    }
  }
}
