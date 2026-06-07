import type { Sql } from "@/shared/db/client.ts";
import type { Task, UpdateTaskInput } from "@/modules/tasks/tasks.schema.ts";
import type { GeneratedTask } from "@/ai/schemas.ts";

interface Row {
  id: string;
  project_id: string;
  title: string;
  description: string;
  module: string;
  status: Task["status"];
  priority: Task["priority"];
  estimate: string;
  position: number;
  github_issue_number: number | null;
  github_issue_url: string | null;
  created_at: Date;
}

const toTask = (r: Row): Task => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  description: r.description,
  module: r.module,
  status: r.status,
  priority: r.priority,
  estimate: r.estimate,
  position: r.position,
  githubIssueNumber: r.github_issue_number,
  githubIssueUrl: r.github_issue_url,
  createdAt: r.created_at.toISOString(),
});

export class TasksRepository {
  constructor(private readonly sql: Sql) {}

  async createMany(projectId: string, tasks: GeneratedTask[]): Promise<Task[]> {
    if (tasks.length === 0) return [];
    const rows = await this.sql<Row[]>`
      INSERT INTO tasks ${this.sql(
        tasks.map((t, i) => ({
          project_id: projectId,
          title: t.title,
          description: t.description,
          module: t.module,
          priority: t.priority,
          estimate: t.estimate,
          position: i,
        })),
      )}
      RETURNING *
    `;
    return rows.map(toTask);
  }

  async listByProject(projectId: string): Promise<Task[]> {
    const rows = await this.sql<Row[]>`
      SELECT * FROM tasks WHERE project_id = ${projectId}
      ORDER BY position ASC, created_at ASC
    `;
    return rows.map(toTask);
  }

  async update(id: string, patch: UpdateTaskInput): Promise<Task | null> {
    const rows = await this.sql<Row[]>`
      UPDATE tasks SET
        title = ${patch.title ?? this.sql`title`},
        description = ${patch.description ?? this.sql`description`},
        status = ${patch.status ?? this.sql`status`},
        priority = ${patch.priority ?? this.sql`priority`}
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ? toTask(rows[0]) : null;
  }

  async linkGithubIssue(id: string, issue: { number: number; url: string }): Promise<void> {
    await this.sql`
      UPDATE tasks SET github_issue_number = ${issue.number}, github_issue_url = ${issue.url}
      WHERE id = ${id}
    `;
  }
}
