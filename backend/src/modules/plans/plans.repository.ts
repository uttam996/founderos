import type { Sql } from "@/shared/db/client.ts";
import type { StartupPlan, SaveStartupPlanInput } from "@/modules/plans/plans.schema.ts";
import type { ProductOutput } from "@/ai/schemas.ts";

interface Row {
  id: string;
  project_id: string;
  run_id: string | null;
  market_analysis: StartupPlan["market"];
  competitor_analysis: StartupPlan["competitors"];
  opportunities: StartupPlan["opportunities"];
  mvp_features: ProductOutput["mvpFeatures"] | null;
  roadmap: ProductOutput["roadmap"] | null;
  pricing_strategy: StartupPlan["pricing"];
  financials: StartupPlan["financials"];
  architecture: StartupPlan["architecture"];
  launch_plan: StartupPlan["launchPlan"];
  review: StartupPlan["review"];
  summary: string | null;
  created_at: Date;
}

const toPlan = (r: Row): StartupPlan => ({
  id: r.id,
  projectId: r.project_id,
  runId: r.run_id,
  market: r.market_analysis,
  competitors: r.competitor_analysis,
  opportunities: r.opportunities,
  mvpFeatures: r.mvp_features,
  roadmap: r.roadmap,
  productRationale: null,
  pricing: r.pricing_strategy,
  financials: r.financials,
  architecture: r.architecture,
  launchPlan: r.launch_plan,
  review: r.review,
  summary: r.summary,
  createdAt: r.created_at.toISOString(),
});

export class PlansRepository {
  constructor(private readonly sql: Sql) {}

  // postgres.js encodes objects/arrays to jsonb via sql.json(); pre-stringifying
  // would store a quoted JSON string instead of a real object.
  private j(v: unknown) {
    return v === null || v === undefined ? null : this.sql.json(v as never);
  }

  async save(input: SaveStartupPlanInput): Promise<StartupPlan> {
    const [row] = await this.sql<Row[]>`
      INSERT INTO startup_plans (
        project_id, run_id, market_analysis, competitor_analysis, opportunities,
        mvp_features, roadmap, pricing_strategy, financials, architecture,
        launch_plan, review, summary
      ) VALUES (
        ${input.projectId}, ${input.runId},
        ${this.j(input.market)}, ${this.j(input.competitors)}, ${this.j(input.opportunities)},
        ${this.j(input.product?.mvpFeatures ?? null)}, ${this.j(input.product?.roadmap ?? null)},
        ${this.j(input.pricing)}, ${this.j(input.financials)}, ${this.j(input.architecture)},
        ${this.j(input.launchPlan)}, ${this.j(input.review)}, ${input.summary}
      )
      RETURNING *
    `;
    return toPlan(row!);
  }

  async latestByProject(projectId: string): Promise<StartupPlan | null> {
    const rows = await this.sql<Row[]>`
      SELECT * FROM startup_plans WHERE project_id = ${projectId}
      ORDER BY created_at DESC LIMIT 1
    `;
    return rows[0] ? toPlan(rows[0]) : null;
  }

  async listByProject(projectId: string): Promise<StartupPlan[]> {
    const rows = await this.sql<Row[]>`
      SELECT * FROM startup_plans WHERE project_id = ${projectId}
      ORDER BY created_at DESC
    `;
    return rows.map(toPlan);
  }
}
