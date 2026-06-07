import { env } from "@/config/env.ts";

type Level = "debug" | "info" | "warn" | "error";

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = order[env.LOG_LEVEL];

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (order[level] < threshold) return;
  const line = {
    t: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  };
  const out = level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(line));
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
  child: (scope: string) => ({
    debug: (m: string, meta?: Record<string, unknown>) => emit("debug", m, { scope, ...meta }),
    info: (m: string, meta?: Record<string, unknown>) => emit("info", m, { scope, ...meta }),
    warn: (m: string, meta?: Record<string, unknown>) => emit("warn", m, { scope, ...meta }),
    error: (m: string, meta?: Record<string, unknown>) => emit("error", m, { scope, ...meta }),
  }),
};

export type Logger = typeof logger;
