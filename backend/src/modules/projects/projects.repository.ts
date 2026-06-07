import type { Sql } from "@/shared/db/client.ts";
import type { Project } from "@/modules/projects/projects.schema.ts";

interface Row {
  id: string;
  name: string;
  idea: string;
  status: Project["status"];
  github_repo: string | null;
  created_at: Date;
  updated_at: Date;
}

const toProject = (r: Row): Project => ({
  id: r.id,
  name: r.name,
  idea: r.idea,
  status: r.status,
  githubRepo: r.github_repo,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
});

export class ProjectsRepository {
  constructor(private readonly sql: Sql) {}

  async create(name: string, idea: string): Promise<Project> {
    const [row] = await this.sql<Row[]>`
      INSERT INTO projects (name, idea) VALUES (${name}, ${idea})
      RETURNING *
    `;
    return toProject(row!);
  }

  async list(): Promise<Project[]> {
    const rows = await this.sql<Row[]>`SELECT * FROM projects ORDER BY created_at DESC`;
    return rows.map(toProject);
  }

  async findById(id: string): Promise<Project | null> {
    const rows = await this.sql<Row[]>`SELECT * FROM projects WHERE id = ${id} LIMIT 1`;
    return rows[0] ? toProject(rows[0]) : null;
  }

  async setStatus(id: string, status: Project["status"]): Promise<void> {
    await this.sql`UPDATE projects SET status = ${status}, updated_at = now() WHERE id = ${id}`;
  }

  async setGithubRepo(id: string, repo: string): Promise<void> {
    await this.sql`UPDATE projects SET github_repo = ${repo}, updated_at = now() WHERE id = ${id}`;
  }
}
