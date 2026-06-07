import type { EmbeddingsProvider } from "@/ai/embeddings/provider.ts";
import { env } from "@/config/env.ts";

/**
 * Deterministic, dependency-free embeddings for offline mode. Produces a
 * stable, L2-normalized vector from a hashed bag-of-tokens so cosine similarity
 * between semantically overlapping texts is still meaningful for demos/tests.
 */
export class MockEmbeddings implements EmbeddingsProvider {
  readonly name = "mock";
  readonly dim = env.EMBEDDING_DIM;

  async embed(text: string): Promise<number[]> {
    return this.vectorize(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.vectorize(t));
  }

  private vectorize(text: string): number[] {
    const vec = new Array(this.dim).fill(0) as number[];
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const token of tokens) {
      const h = hash(token);
      const idx = h % this.dim;
      const idx2 = (idx * 7 + 13) % this.dim;
      vec[idx] = (vec[idx] ?? 0) + 1;
      // spread a little signal to a second bucket to reduce collisions
      vec[idx2] = (vec[idx2] ?? 0) + 0.5;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
