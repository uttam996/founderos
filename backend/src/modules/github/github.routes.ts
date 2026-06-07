import { Hono } from "hono";
import { ok } from "@/shared/http/respond.ts";
import { validate } from "@/shared/http/validate.ts";
import {
  CreateIssueSchema,
  ReviewCodeSchema,
  SyncProjectIssuesSchema,
  type GitHubService,
} from "@/modules/github/github.service.ts";
import type { ProjectsService } from "@/modules/projects/projects.service.ts";
import type { TasksService } from "@/modules/tasks/tasks.service.ts";

export function githubRoutes(deps: {
  github: GitHubService;
  projects: ProjectsService;
  tasks: TasksService;
}) {
  const r = new Hono();

  r.get("/status", (c) => ok(c, { ...deps.github.getConfig(), status: "ready" }));

  r.post("/issues", validate("json", CreateIssueSchema), async (c) =>
    ok(c, await deps.github.createIssue(c.req.valid("json"))),
  );

  r.post("/review", validate("json", ReviewCodeSchema), async (c) =>
    ok(c, await deps.github.reviewCode(c.req.valid("json"))),
  );

  /** Create GitHub issues for all tasks in a project that aren't linked yet. */
  r.post("/projects/:projectId/sync", validate("json", SyncProjectIssuesSchema), async (c) => {
    const projectId = c.req.param("projectId");
    const body = c.req.valid("json");
    const project = await deps.projects.get(projectId);
    const tasks = await deps.tasks.list(projectId);
    const repo = deps.github.resolveRepo(body.repo ?? project.githubRepo ?? undefined);

    const result = await deps.github.syncProjectTasks(
      projectId,
      project.name,
      project.idea,
      repo,
      tasks,
      async (taskId, issue) => deps.tasks.linkGithubIssue(taskId, issue),
    );

    await deps.projects.setGithubRepo(projectId, repo);
    return ok(c, result);
  });

  return r;
}
