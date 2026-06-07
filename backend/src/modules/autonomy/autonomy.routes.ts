import { Hono } from "hono";
import { ok } from "@/shared/http/respond.ts";
import { validate } from "@/shared/http/validate.ts";
import { BuildModuleSchema, type AutonomyService } from "@/modules/autonomy/autonomy.service.ts";

export function autonomyRoutes(deps: { autonomy: AutonomyService }) {
  const r = new Hono();

  r.get("/status", (c) => ok(c, { phase: 3, available: false }));

  r.post("/build", validate("json", BuildModuleSchema), async (c) =>
    ok(c, await deps.autonomy.build(c.req.valid("json"))),
  );

  return r;
}
