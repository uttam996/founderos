import { sql, closeDb } from "@/shared/db/client.ts";
import { logger } from "@/shared/logger.ts";

/** Inserts a couple of example projects so the UI has content on first run. */
async function seed() {
  const examples = [
    { name: "Restaurant SaaS", idea: "Build a Restaurant SaaS" },
    { name: "Fleet Management Platform", idea: "Build a Fleet Management Platform" },
    { name: "AI Interview Platform", idea: "Build an AI Interview Platform" },
  ];

  for (const ex of examples) {
    const existing = await sql`SELECT id FROM projects WHERE name = ${ex.name} LIMIT 1`;
    if (existing.length > 0) continue;
    await sql`INSERT INTO projects (name, idea) VALUES (${ex.name}, ${ex.idea})`;
    logger.info("seed_project", { name: ex.name });
  }
}

seed()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch(async (e) => {
    logger.error("seed_failed", { message: e instanceof Error ? e.message : String(e) });
    await closeDb();
    process.exit(1);
  });
