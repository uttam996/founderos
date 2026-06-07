import type {
  LlmProvider,
  StructuredRequest,
  TextRequest,
} from "@/ai/llm/provider.ts";
import { AppError } from "@/shared/errors.ts";
import { logger } from "@/shared/logger.ts";

const log = logger.child("mock-llm");

/**
 * Deterministic LLM used when no API key is configured. It returns each call's
 * `mock()` factory output, validated against the same Zod schema the real
 * provider would satisfy. A small artificial latency makes streaming feel real.
 */
export class MockProvider implements LlmProvider {
  readonly name = "mock";
  readonly model = "mock-deterministic";

  async generateStructured<T>(req: StructuredRequest<T>): Promise<T> {
    await delay();
    const candidate = req.mock();
    const parsed = req.schema.safeParse(candidate);
    if (!parsed.success) {
      log.error("mock_invalid", {
        schema: req.schemaName,
        issues: parsed.error.issues,
      });
      throw AppError.internal(
        `Mock output for ${req.schemaName} does not satisfy its schema`,
      );
    }
    return parsed.data;
  }

  async generateText(req: TextRequest): Promise<string> {
    await delay();
    return req.mock();
  }
}

function delay() {
  return new Promise((r) =>
    setTimeout(r, 250 + Math.floor(Math.random() * 250)),
  );
}
