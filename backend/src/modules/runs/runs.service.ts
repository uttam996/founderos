import type { Orchestrator, PipelineEvent } from "@/ai/index.ts";
import type { GraphStateType } from "@/ai/graph/state.ts";
import type { RunsRepository, Run } from "@/modules/runs/runs.repository.ts";
import type { RunHub } from "@/modules/runs/run-hub.ts";
import type { ProjectsService } from "@/modules/projects/projects.service.ts";
import type { PlansService } from "@/modules/plans/plans.service.ts";
import type { TasksService } from "@/modules/tasks/tasks.service.ts";
import type { MemoryService } from "@/modules/memory/memory.service.ts";
import { AppError } from "@/shared/errors.ts";
import { logger } from "@/shared/logger.ts";

const log = logger.child("runs");
const now = () => new Date().toISOString();

export interface RunsDeps {
  orchestrator: Orchestrator;
  runsRepo: RunsRepository;
  hub: RunHub;
  projects: ProjectsService;
  plans: PlansService;
  tasks: TasksService;
  memory: MemoryService;
}

export class RunsService {
  constructor(private readonly deps: RunsDeps) {}

  /** Start a pipeline for a project. Returns immediately with the run id; the
   *  pipeline executes in the background and streams via the RunHub. */
  async start(projectId: string): Promise<{ runId: string }> {
    const project = await this.deps.projects.get(projectId);
    const run = await this.deps.runsRepo.create(project.id);
    await this.deps.projects.setStatus(project.id, "running");
    this.deps.hub.create(run.id);

    // Fire-and-forget; errors are captured inside execute().
    void this.execute(run, project.id, project.idea);
    return { runId: run.id };
  }

  async get(runId: string): Promise<Run> {
    const run = await this.deps.runsRepo.findById(runId);
    if (!run) throw AppError.notFound("Run not found");
    return run;
  }

  private async execute(run: Run, projectId: string, idea: string): Promise<void> {
    const { hub, orchestrator } = this.deps;
    try {
      const finalState = await orchestrator.run({ projectId, idea }, (e: PipelineEvent) => {
        // The service owns the terminal "done" event (emitted after persistence).
        if (e.type !== "done") hub.publish(run.id, e);
      });

      await this.persist(run.id, projectId, idea, finalState);

      hub.publish(run.id, { type: "done", at: now() });
      await this.deps.runsRepo.finish(run.id, "completed", null);
      await this.deps.projects.setStatus(projectId, "ready");
      log.info("pipeline_done", { runId: run.id, projectId, tasks: finalState.tasks.length });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      log.error("pipeline_failed", { runId: run.id, message });
      hub.publish(run.id, { type: "error", message, at: now() });
      await this.deps.runsRepo.finish(run.id, "failed", message);
      await this.deps.projects.setStatus(projectId, "error");
    } finally {
      hub.close(run.id);
    }
  }

  private async persist(
    runId: string,
    projectId: string,
    idea: string,
    state: GraphStateType,
  ): Promise<void> {
    await this.deps.plans.save({
      projectId,
      runId,
      market: state.market,
      competitors: state.competitors,
      opportunities: state.opportunities,
      product: state.product,
      pricing: state.pricing,
      financials: state.financials,
      architecture: state.architecture,
      launchPlan: state.launchPlan,
      review: state.review,
      summary: state.summary,
    });

    if (state.tasks.length > 0) {
      await this.deps.tasks.createMany(projectId, state.tasks);
    }

    await this.saveAgentOutputs(runId, projectId, state);
    await this.deps.memory.rememberRunArtifacts(projectId, idea, state.summary);
  }

  private async saveAgentOutputs(runId: string, projectId: string, s: GraphStateType): Promise<void> {
    const outputs: Record<string, unknown> = {
      supervisor: s.plan,
      research: { market: s.market, competitors: s.competitors, opportunities: s.opportunities },
      "product-manager": s.product,
      finance: { pricing: s.pricing, financials: s.financials },
      engineer: { architecture: s.architecture, tasks: s.tasks },
      marketing: { launchPlan: s.launchPlan },
      review: { review: s.review, summary: s.summary },
    };
    for (const [agent, output] of Object.entries(outputs)) {
      if (output) await this.deps.runsRepo.saveAgentOutput(projectId, runId, agent, output);
    }
  }
}
