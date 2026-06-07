import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { env } from "@/config/env.ts";
import type { Container } from "@/config/container.ts";
import { errorHandler, requestLogger } from "@/shared/http/middleware.ts";
import { pingDb } from "@/shared/db/client.ts";
import { projectsRoutes } from "@/modules/projects/projects.routes.ts";
import { runsRoutes } from "@/modules/runs/runs.routes.ts";
import { tasksRoutes } from "@/modules/tasks/tasks.routes.ts";
import { memoryRoutes } from "@/modules/memory/memory.routes.ts";
import { settingsRoutes } from "@/modules/settings/settings.routes.ts";
import { githubRoutes } from "@/modules/github/github.routes.ts";
import { autonomyRoutes } from "@/modules/autonomy/autonomy.routes.ts";

/** Builds the Hono application from a fully-wired container. */
export function createApp(c: Container) {
  const app = new Hono();

  app.use("*", requestLogger);
  app.use(
    "*",
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );
  app.onError(errorHandler);

  const health = async (ctx: Context) => {
    const db = await pingDb();
    return ctx.json({
      status: db ? "ok" : "degraded",
      db,
      llm: { provider: c.ai.llm.name, model: c.ai.llm.model },
      embeddings: { provider: c.ai.embeddings.name, dim: c.ai.embeddings.dim },
      time: new Date().toISOString(),
    });
  };
  // Exposed at root and under /api (the frontend reaches the backend through the
  // Vite proxy which only forwards /api/*).
  app.get("/health", health);

  const api = new Hono();
  api.get("/health", health);
  api.route("/projects", projectsRoutes({ projects: c.projects, plans: c.plans, tasks: c.tasks, runs: c.runs }));
  api.route("/runs", runsRoutes({ runs: c.runs, hub: c.hub }));
  api.route("/tasks", tasksRoutes({ tasks: c.tasks }));
  api.route("/memory", memoryRoutes({ memory: c.memory }));
  api.route("/settings", settingsRoutes({ settings: c.settings }));
  api.route("/github", githubRoutes({ github: c.github, projects: c.projects, tasks: c.tasks }));
  api.route("/autonomy", autonomyRoutes({ autonomy: c.autonomy }));
  app.route("/api", api);

  app.notFound((ctx) => ctx.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404));

  return app;
}
