import { z } from "zod";

export const TaskStatus = z.enum(["todo", "in_progress", "done"]);
export const TaskPriority = z.enum(["low", "medium", "high"]);

export const UpdateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  module: string;
  status: z.infer<typeof TaskStatus>;
  priority: z.infer<typeof TaskPriority>;
  estimate: string;
  position: number;
  githubIssueNumber: number | null;
  githubIssueUrl: string | null;
  createdAt: string;
}
