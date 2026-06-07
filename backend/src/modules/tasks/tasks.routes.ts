import { Hono } from "hono";
import { ok } from "@/shared/http/respond.ts";
import { validate } from "@/shared/http/validate.ts";
import { UpdateTaskSchema } from "@/modules/tasks/tasks.schema.ts";
import type { TasksService } from "@/modules/tasks/tasks.service.ts";

export function tasksRoutes(deps: { tasks: TasksService }) {
  const r = new Hono();

  r.patch("/:id", validate("json", UpdateTaskSchema), async (c) =>
    ok(c, await deps.tasks.update(c.req.param("id"), c.req.valid("json"))),
  );

  return r;
}
