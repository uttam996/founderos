import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sql, closeDb } from "@/shared/db/client.ts";
import { logger } from "@/shared/logger.ts";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");

/**
 * Forward-only migration runner. Applies any *.sql file in /migrations that
 * has not yet been recorded in the _migrations table, in lexical order.
 */
async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = await sql<{ name: string }[]>`SELECT name FROM _migrations`;
  const appliedSet = new Set(applied.map((r) => r.name));

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;
    const path = join(migrationsDir, file);
    const content = await Bun.file(path).text();
    logger.info("migration_applying", { file });
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO _migrations (name) VALUES (${file})`;
    });
    count++;
  }

  logger.info("migration_complete", { applied: count, total: files.length });

  await ensureMemories();
}

const EMBED_DIM = 768; // must match EMBEDDING_DIM / embeddings provider

/**
 * Creates the `memories` table using pgvector when it is available, and a JSONB
 * fallback otherwise. This lets FounderOS run on any Postgres; once pgvector is
 * installed the table is automatically upgraded to a real vector column on the
 * next migrate.
 */
async function ensureMemories() {
  let vectorReady = false;
  try {
    await sql.unsafe("CREATE EXTENSION IF NOT EXISTS vector");
  } catch (e) {
    logger.warn("pgvector_extension_unavailable", {
      message: e instanceof Error ? e.message : String(e),
    });
  }
  const typeRows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') AS exists
  `;
  vectorReady = typeRows[0]?.exists ?? false;

  const [existing] = await sql<{ udt: string }[]>`
    SELECT udt_name AS udt
    FROM information_schema.columns
    WHERE table_name = 'memories' AND column_name = 'embedding'
  `;

  if (existing && vectorReady && existing.udt !== "vector") {
    logger.info("memories_upgrade_to_vector", {});
    await sql.unsafe("DROP TABLE IF EXISTS memories CASCADE");
  } else if (existing) {
    logger.info("memories_ready", { mode: existing.udt === "vector" ? "pgvector" : "jsonb" });
    return;
  }

  if (vectorReady) {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS memories (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
        kind        TEXT NOT NULL DEFAULT 'note',
        content     TEXT NOT NULL,
        embedding   VECTOR(${EMBED_DIM}),
        metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_memories_embedding
        ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);
    logger.info("memories_ready", { mode: "pgvector" });
  } else {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS memories (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
        kind        TEXT NOT NULL DEFAULT 'note',
        content     TEXT NOT NULL,
        embedding   JSONB,
        metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    logger.warn("memories_ready", {
      mode: "jsonb-fallback",
      note: "Install pgvector for ANN search; recall uses in-app cosine for now.",
    });
  }
}

migrate()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch(async (e) => {
    logger.error("migration_failed", { message: e instanceof Error ? e.message : String(e) });
    await closeDb();
    process.exit(1);
  });
