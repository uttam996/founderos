import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import type { EmbeddingsProvider } from "@/ai/embeddings/provider.ts";
import { withRetry } from "@/ai/llm/retry.ts";
import { env } from "@/config/env.ts";
import { AppError } from "@/shared/errors.ts";

/** Gemini embeddings (text-embedding-004, 768 dims by default). */
export class GeminiEmbeddings implements EmbeddingsProvider {
  readonly name = "gemini";
  readonly dim = env.EMBEDDING_DIM;
  private readonly client: GoogleGenerativeAIEmbeddings;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: env.EMBEDDING_MODEL,
    });
  }

  async embed(text: string): Promise<number[]> {
    try {
      return await withRetry(() => this.client.embedQuery(text), { label: "embed" });
    } catch {
      throw AppError.upstream("Gemini embedding failed");
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    try {
      return await withRetry(() => this.client.embedDocuments(texts), { label: "embed_batch" });
    } catch {
      throw AppError.upstream("Gemini batch embedding failed");
    }
  }
}
