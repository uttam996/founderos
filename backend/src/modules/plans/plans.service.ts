import type { PlansRepository } from "@/modules/plans/plans.repository.ts";
import type { StartupPlan, SaveStartupPlanInput } from "@/modules/plans/plans.schema.ts";
import { AppError } from "@/shared/errors.ts";

export class PlansService {
  constructor(private readonly repo: PlansRepository) {}

  save(input: SaveStartupPlanInput): Promise<StartupPlan> {
    return this.repo.save(input);
  }

  async latest(projectId: string): Promise<StartupPlan> {
    const plan = await this.repo.latestByProject(projectId);
    if (!plan) throw AppError.notFound("No startup plan yet for this project. Run the agents first.");
    return plan;
  }

  latestOrNull(projectId: string): Promise<StartupPlan | null> {
    return this.repo.latestByProject(projectId);
  }

  list(projectId: string): Promise<StartupPlan[]> {
    return this.repo.listByProject(projectId);
  }
}
