import { env } from "@/config/env.ts";
import { buildContainer } from "@/config/container.ts";
import { createApp } from "@/app.ts";
import { logger } from "@/shared/logger.ts";
import { closeDb } from "@/shared/db/client.ts";

const container = await buildContainer();
const app = createApp(container);

const server = Bun.serve({
  port: env.PORT,
  // SSE streams need a long idle timeout (Bun caps at 255s).
  idleTimeout: 240,
  fetch: app.fetch,
});

logger.info("server_started", {
  url: `http://localhost:${server.port}`,
  env: env.NODE_ENV,
  llm: container.ai.llm.name,
  embeddings: container.ai.embeddings.name,
});

const shutdown = async (signal: string) => {
  logger.info("shutdown", { signal });
  server.stop();
  await closeDb();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
