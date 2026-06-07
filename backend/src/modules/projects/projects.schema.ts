import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  idea: z.string().min(3).max(1000),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export interface Project {
  id: string;
  name: string;
  idea: string;
  status: "draft" | "running" | "ready" | "error";
  githubRepo: string | null;
  createdAt: string;
  updatedAt: string;
}
