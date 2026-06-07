import { env } from "@/config/env.ts";
import { logger } from "@/shared/logger.ts";
import type { LlmProvider } from "@/ai/llm/provider.ts";
import { GeminiProvider } from "@/ai/llm/gemini.ts";
import { GroqProvider } from "@/ai/llm/groq.ts";
import { MockProvider } from "@/ai/llm/mock.ts";

export type { LlmProvider, StructuredRequest, TextRequest } from "@/ai/llm/provider.ts";
export { MutableLlmProvider } from "@/ai/llm/mutable.ts";

export type LlmProviderName = "groq" | "gemini" | "mock";

/** Explicit LLM configuration (env default, overridable at runtime via Settings). */
export interface LlmConfig {
  provider: LlmProviderName;
  model: string;
  baseUrl: string;
  apiKey: string;
}

/** Build a concrete provider from an explicit config. Falls back to mock when a
 *  real provider is selected without an API key. */
export function buildLlmProvider(cfg: LlmConfig): LlmProvider {
  if (cfg.provider === "groq" && cfg.apiKey.trim()) {
    return new GroqProvider(cfg.apiKey, cfg.baseUrl || env.GROQ_BASE_URL, cfg.model || env.GROQ_MODEL);
  }
  if (cfg.provider === "gemini" && cfg.apiKey.trim()) {
    return new GeminiProvider(cfg.apiKey, cfg.model || env.LLM_MODEL);
  }
  return new MockProvider();
}

/** Default config derived from validated environment variables. */
export function envLlmConfig(): LlmConfig {
  const provider = env.effectiveLlmProvider;
  return {
    provider,
    model: provider === "gemini" ? env.LLM_MODEL : env.GROQ_MODEL,
    baseUrl: env.GROQ_BASE_URL,
    apiKey:
      provider === "groq"
        ? env.GROQ_API_KEY ?? ""
        : provider === "gemini"
          ? env.GOOGLE_API_KEY ?? ""
          : "",
  };
}

/** Composition: build the LLM provider from environment configuration. */
export function createLlmProvider(): LlmProvider {
  const provider = buildLlmProvider(envLlmConfig());
  logger.info("llm_provider", { provider: provider.name, model: provider.model });
  return provider;
}
