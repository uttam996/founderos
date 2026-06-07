import type { Sql } from "@/shared/db/client.ts";
import type { MemoryHit } from "@/modules/memory/memory.schema.ts";
import { toVectorLiteral } from "@/shared/db/helpers.ts";

interface InsertInput {
  projectId: string | null;
  kind: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

interface SearchRow {
  id: string;
  project_id: string | null;
  kind: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
  created_at: Date;
}

interface FallbackRow {
  id: string;
  project_id: string | null;
  kind: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
  created_at: Date;
}

/**
 * Memory store that works with OR without pgvector. When the `memories.embedding`
 * column is a real `vector` it uses the `<=>` cosine operator (ANN). Otherwise it
 * stores embeddings as JSONB and ranks candidates with in-app cosine similarity.
 */
export class MemoryRepository {
  private vectorMode: Promise<boolean> | null = null;

  constructor(private readonly sql: Sql) {}

  private async isVectorMode(): Promise<boolean> {
    if (!this.vectorMode) {
      this.vectorMode = this.sql<{ udt: string }[]>`
        SELECT udt_name AS udt
        FROM information_schema.columns
        WHERE table_name = 'memories' AND column_name = 'embedding'
      `.then((rows) => rows[0]?.udt === "vector");
    }
    return this.vectorMode;
  }

  async insert(input: InsertInput): Promise<string> {
    if (await this.isVectorMode()) {
      const vec = toVectorLiteral(input.embedding);
      const [row] = await this.sql<{ id: string }[]>`
        INSERT INTO memories (project_id, kind, content, embedding, metadata)
        VALUES (
          ${input.projectId}, ${input.kind}, ${input.content},
          ${vec}::vector, ${this.sql.json(input.metadata as never)}
        )
        RETURNING id
      `;
      return row!.id;
    }

    const [row] = await this.sql<{ id: string }[]>`
      INSERT INTO memories (project_id, kind, content, embedding, metadata)
      VALUES (
        ${input.projectId}, ${input.kind}, ${input.content},
        ${this.sql.json(input.embedding as never)}, ${this.sql.json(input.metadata as never)}
      )
      RETURNING id
    `;
    return row!.id;
  }

  /** Cosine similarity search. Optionally scoped to a project. */
  async search(embedding: number[], limit: number, projectId?: string): Promise<MemoryHit[]> {
    if (await this.isVectorMode()) {
      return this.searchVector(embedding, limit, projectId);
    }
    return this.searchFallback(embedding, limit, projectId);
  }

  private async searchVector(
    embedding: number[],
    limit: number,
    projectId?: string,
  ): Promise<MemoryHit[]> {
    const vec = toVectorLiteral(embedding);
    const rows = projectId
      ? await this.sql<SearchRow[]>`
          SELECT id, project_id, kind, content, metadata,
                 1 - (embedding <=> ${vec}::vector) AS similarity, created_at
          FROM memories
          WHERE embedding IS NOT NULL AND project_id = ${projectId}
          ORDER BY embedding <=> ${vec}::vector ASC
          LIMIT ${limit}
        `
      : await this.sql<SearchRow[]>`
          SELECT id, project_id, kind, content, metadata,
                 1 - (embedding <=> ${vec}::vector) AS similarity, created_at
          FROM memories
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> ${vec}::vector ASC
          LIMIT ${limit}
        `;

    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      kind: r.kind,
      content: r.content,
      metadata: r.metadata ?? {},
      similarity: Number(r.similarity),
      createdAt: r.created_at.toISOString(),
    }));
  }

  private async searchFallback(
    embedding: number[],
    limit: number,
    projectId?: string,
  ): Promise<MemoryHit[]> {
    const rows = projectId
      ? await this.sql<FallbackRow[]>`
          SELECT id, project_id, kind, content, metadata, embedding, created_at
          FROM memories
          WHERE embedding IS NOT NULL AND project_id = ${projectId}
        `
      : await this.sql<FallbackRow[]>`
          SELECT id, project_id, kind, content, metadata, embedding, created_at
          FROM memories
          WHERE embedding IS NOT NULL
        `;

    return rows
      .map((r) => ({
        id: r.id,
        projectId: r.project_id,
        kind: r.kind,
        content: r.content,
        metadata: r.metadata ?? {},
        similarity: cosineSimilarity(embedding, r.embedding ?? []),
        createdAt: r.created_at.toISOString(),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < n; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
