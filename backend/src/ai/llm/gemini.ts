import type {
  LlmProvider,
  StructuredRequest,
  TextRequest,
} from "@/ai/llm/provider.ts";
import { withRetry } from "@/ai/llm/retry.ts";
import { AppError } from "@/shared/errors.ts";
import { logger } from "@/shared/logger.ts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const log = logger.child("gemini");

/**
 * Google Gemini provider (free tier). Uses LangChain's structured-output binding
 * (function-calling style) so responses are parsed and validated against Zod.
 */
export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";
  readonly model: string;
  private readonly apiKey: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  private chat(temperature: number) {
    return new ChatGoogleGenerativeAI({
      apiKey: this.apiKey,
      model: this.model,
      temperature,
      maxRetries: 0, // we manage retries ourselves
      maxOutputTokens: 2048,
    });
  }

  async generateStructured<T>(req: StructuredRequest<T>): Promise<T> {
    const model = this.chat(req.temperature ?? 0.4).withStructuredOutput(
      req.schema,
      {
        name: req.schemaName,
      },
    );
    try {
      return await withRetry(
        () =>
          model.invoke([
            new SystemMessage(req.system),
            new HumanMessage(req.prompt),
          ]) as Promise<T>,
        { label: `gemini:${req.schemaName}` },
      );
    } catch (e) {
      log.error("structured_failed", {
        schema: req.schemaName,
        message: e instanceof Error ? e.message : String(e),
      });
      throw AppError.upstream(
        `Gemini structured generation failed for ${req.schemaName}`,
      );
    }
  }

  async generateText(req: TextRequest): Promise<string> {
    const model = this.chat(req.temperature ?? 0.5);
    try {
      const res = await withRetry(
        () =>
          model.invoke([
            new SystemMessage(req.system),
            new HumanMessage(req.prompt),
          ]),
        { label: "gemini:text" },
      );
      return typeof res.content === "string"
        ? res.content
        : JSON.stringify(res.content);
    } catch (e) {
      log.error("text_failed", {
        message: e instanceof Error ? e.message : String(e),
      });
      throw AppError.upstream("Gemini text generation failed");
    }
  }
}
