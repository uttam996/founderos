import { Hono } from "hono";
import { ok, created } from "@/shared/http/respond.ts";
import { validate } from "@/shared/http/validate.ts";
import { CreateProjectSchema } from "@/modules/projects/projects.schema.ts";
import type { ProjectsService } from "@/modules/projects/projects.service.ts";
import type { PlansService } from "@/modules/plans/plans.service.ts";
import type { TasksService } from "@/modules/tasks/tasks.service.ts";
import type { RunsService } from "@/modules/runs/runs.service.ts";

export function projectsRoutes(deps: {
  projects: ProjectsService;
  plans: PlansService;
  tasks: TasksService;
  runs: RunsService;
}) {
  const r = new Hono();

  r.get("/", async (c) => ok(c, await deps.projects.list()));

  r.post("/", validate("json", CreateProjectSchema), async (c) =>
    created(c, await deps.projects.create(c.req.valid("json"))),
  );

  r.get("/:id", async (c) => ok(c, await deps.projects.get(c.req.param("id"))));

  // Kick off the multi-agent pipeline.
  r.post("/:id/run", async (c) => ok(c, await deps.runs.start(c.req.param("id"))));

  // Latest consolidated plan.
  r.get("/:id/plan", async (c) => ok(c, await deps.plans.latest(c.req.param("id"))));

  // Plan history.
  r.get("/:id/plans", async (c) => ok(c, await deps.plans.list(c.req.param("id"))));

  // Generated development tasks.
  r.get("/:id/tasks", async (c) => ok(c, await deps.tasks.list(c.req.param("id"))));

  // Research-only view (subset of the plan).
  r.get("/:id/research", async (c) => {
    const plan = await deps.plans.latestOrNull(c.req.param("id"));
    return ok(c, {
      market: plan?.market ?? null,
      competitors: plan?.competitors ?? null,
      opportunities: plan?.opportunities ?? null,
    });
  });

  return r;
}
