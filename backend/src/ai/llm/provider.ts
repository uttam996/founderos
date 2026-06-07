import type { z } from "zod";

/**
 * Provider-agnostic LLM abstraction. Agents depend only on this interface, so
 * we can swap Gemini / mock (or add Groq/Ollama) without touching agent code.
 *
 * Every call carries a `mock` factory: a deterministic, schema-valid fallback
 * used when running without API keys. This keeps the entire pipeline + UI fully
 * functional offline while remaining type-safe.
 */
export interface StructuredRequest<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
  temperature?: number;
  /** Deterministic fallback for mock mode. */
  mock: () => T;
}

export interface TextRequest {
  system: string;
  prompt: string;
  temperature?: number;
  mock: () => string;
}

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  generateStructured<T>(req: StructuredRequest<T>): Promise<T>;
  generateText(req: TextRequest): Promise<string>;
}
