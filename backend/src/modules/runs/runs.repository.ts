import type { Sql } from "@/shared/db/client.ts";

export interface Run {
  id: string;
  projectId: string;
  status: "pending" | "running" | "completed" | "failed";
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface Row {
  id: string;
  project_id: string;
  status: Run["status"];
  error: string | null;
  started_at: Date;
  finished_at: Date | null;
}

const toRun = (r: Row): Run => ({
  id: r.id,
  projectId: r.project_id,
  status: r.status,
  error: r.error,
  startedAt: r.started_at.toISOString(),
  finishedAt: r.finished_at ? r.finished_at.toISOString() : null,
});

export class RunsRepository {
  constructor(private readonly sql: Sql) {}

  async create(projectId: string): Promise<Run> {
    const [row] = await this.sql<Row[]>`
      INSERT INTO runs (project_id, status) VALUES (${projectId}, 'running')
      RETURNING *
    `;
    return toRun(row!);
  }

  async finish(id: string, status: Run["status"], error: string | null): Promise<void> {
    await this.sql`
      UPDATE runs SET status = ${status}, error = ${error}, finished_at = now()
      WHERE id = ${id}
    `;
  }

  async findById(id: string): Promise<Run | null> {
    const rows = await this.sql<Row[]>`SELECT * FROM runs WHERE id = ${id} LIMIT 1`;
    return rows[0] ? toRun(rows[0]) : null;
  }

  async saveAgentOutput(
    projectId: string,
    runId: string,
    agent: string,
    output: unknown,
  ): Promise<void> {
    await this.sql`
      INSERT INTO agent_outputs (project_id, run_id, agent, output)
      VALUES (${projectId}, ${runId}, ${agent}, ${this.sql.json(output as never)})
    `;
  }
}
