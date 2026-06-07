import postgres from "postgres";
import { env } from "@/config/env.ts";
import { logger } from "@/shared/logger.ts";

/**
 * Single shared postgres.js connection pool. `sql` is a tagged-template client
 * that safely parameterizes queries (no string interpolation of user input).
 */
export const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

export type Sql = typeof sql;

export async function pingDb(): Promise<boolean> {
  try {
    await sql`select 1`;
    return true;
  } catch (e) {
    logger.error("db_ping_failed", { message: e instanceof Error ? e.message : String(e) });
    return false;
  }
}

export async function closeDb(): Promise<void> {
  await sql.end({ timeout: 5 });
}
