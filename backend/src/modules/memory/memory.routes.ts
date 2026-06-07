import { Hono } from "hono";
import { ok, created } from "@/shared/http/respond.ts";
import { validate } from "@/shared/http/validate.ts";
import { RememberSchema, RecallSchema } from "@/modules/memory/memory.schema.ts";
import type { MemoryService } from "@/modules/memory/memory.service.ts";

export function memoryRoutes(deps: { memory: MemoryService }) {
  const r = new Hono();

  r.post("/", validate("json", RememberSchema), async (c) =>
    created(c, await deps.memory.remember(c.req.valid("json"))),
  );

  r.post("/search", validate("json", RecallSchema), async (c) =>
    ok(c, await deps.memory.recall(c.req.valid("json"))),
  );

  return r;
}
