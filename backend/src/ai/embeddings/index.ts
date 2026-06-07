import { env } from "@/config/env.ts";
import { logger } from "@/shared/logger.ts";
import type { EmbeddingsProvider } from "@/ai/embeddings/provider.ts";
import { GeminiEmbeddings } from "@/ai/embeddings/gemini.ts";
import { MockEmbeddings } from "@/ai/embeddings/mock.ts";

export type { EmbeddingsProvider } from "@/ai/embeddings/provider.ts";

export function createEmbeddingsProvider(): EmbeddingsProvider {
  if (env.effectiveLlmProvider === "gemini" && env.GOOGLE_API_KEY) {
    logger.info("embeddings_provider", { provider: "gemini", model: env.EMBEDDING_MODEL });
    return new GeminiEmbeddings(env.GOOGLE_API_KEY);
  }
  logger.info("embeddings_provider", { provider: "mock", dim: env.EMBEDDING_DIM });
  return new MockEmbeddings();
}
