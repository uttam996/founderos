import type { MemoryRepository } from "@/modules/memory/memory.repository.ts";
import type { EmbeddingsProvider } from "@/ai/embeddings/index.ts";
import type { RememberInput, RecallInput, MemoryHit } from "@/modules/memory/memory.schema.ts";
import { logger } from "@/shared/logger.ts";

const log = logger.child("memory");

/**
 * Long-term memory service. Embeds content with the configured provider and
 * stores/recalls it via pgvector. Used by the runs pipeline to give agents
 * recall of previous startup discussions.
 */
export class MemoryService {
  constructor(
    private readonly repo: MemoryRepository,
    private readonly embeddings: EmbeddingsProvider,
  ) {}

  async remember(input: RememberInput): Promise<{ id: string }> {
    const embedding = await this.embeddings.embed(input.content);
    const id = await this.repo.insert({
      projectId: input.projectId ?? null,
      kind: input.kind,
      content: input.content,
      embedding,
      metadata: input.metadata ?? {},
    });
    return { id };
  }

  async recall(input: RecallInput): Promise<MemoryHit[]> {
    const embedding = await this.embeddings.embed(input.query);
    return this.repo.search(embedding, input.limit, input.projectId);
  }

  /** Fire-and-forget store of a run's key artifacts for future recall. */
  async rememberRunArtifacts(projectId: string, idea: string, summary: string): Promise<void> {
    try {
      await this.remember({
        projectId,
        kind: "startup_plan",
        content: `Idea: ${idea}\nSummary: ${summary}`,
        metadata: { source: "pipeline" },
      });
    } catch (e) {
      log.warn("remember_failed", { message: e instanceof Error ? e.message : String(e) });
    }
  }
}
