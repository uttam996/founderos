import { Hono } from "hono";
import { ok } from "@/shared/http/respond.ts";
import { validate } from "@/shared/http/validate.ts";
import { UpdateLlmSettingsSchema, UpdateGitHubSettingsSchema } from "@/modules/settings/settings.schema.ts";
import type { SettingsService } from "@/modules/settings/settings.service.ts";

export function settingsRoutes(deps: { settings: SettingsService }) {
  const r = new Hono();

  r.get("/llm", (c) =>
    ok(c, { config: deps.settings.get(), effective: deps.settings.effective() }),
  );

  r.put("/llm", validate("json", UpdateLlmSettingsSchema), async (c) =>
    ok(c, await deps.settings.update(c.req.valid("json"))),
  );

  r.post("/llm/test", validate("json", UpdateLlmSettingsSchema), async (c) =>
    ok(c, await deps.settings.test(c.req.valid("json"))),
  );

  r.get("/github", (c) => ok(c, deps.settings.getGitHub()));

  r.put("/github", validate("json", UpdateGitHubSettingsSchema), async (c) =>
    ok(c, await deps.settings.updateGitHub(c.req.valid("json"))),
  );

  r.post("/github/test", async (c) => ok(c, await deps.settings.testGitHub()));

  return r;
}
