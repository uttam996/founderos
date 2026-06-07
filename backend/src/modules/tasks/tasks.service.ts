import type { TasksRepository } from "@/modules/tasks/tasks.repository.ts";
import type { Task, UpdateTaskInput } from "@/modules/tasks/tasks.schema.ts";
import type { GeneratedTask } from "@/ai/schemas.ts";
import { AppError } from "@/shared/errors.ts";

export class TasksService {
  constructor(private readonly repo: TasksRepository) {}

  createMany(projectId: string, tasks: GeneratedTask[]): Promise<Task[]> {
    return this.repo.createMany(projectId, tasks);
  }

  list(projectId: string): Promise<Task[]> {
    return this.repo.listByProject(projectId);
  }

  async update(id: string, patch: UpdateTaskInput): Promise<Task> {
    const task = await this.repo.update(id, patch);
    if (!task) throw AppError.notFound("Task not found");
    return task;
  }

  linkGithubIssue(id: string, issue: { number: number; url: string }): Promise<void> {
    return this.repo.linkGithubIssue(id, issue);
  }
}
