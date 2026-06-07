import { z } from "zod";

export const RememberSchema = z.object({
  projectId: z.string().uuid().optional(),
  kind: z.string().min(1).max(40).default("note"),
  content: z.string().min(1).max(8000),
  metadata: z.record(z.unknown()).optional(),
});
export type RememberInput = z.infer<typeof RememberSchema>;

export const RecallSchema = z.object({
  query: z.string().min(1).max(2000),
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(50).default(8),
});
export type RecallInput = z.infer<typeof RecallSchema>;

export interface MemoryHit {
  id: string;
  projectId: string | null;
  kind: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
  createdAt: string;
}
