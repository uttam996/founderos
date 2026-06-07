import type { Context, Next } from "hono";
import { ZodError } from "zod";
import { AppError, isAppError } from "@/shared/errors.ts";
import { logger } from "@/shared/logger.ts";

/** Central error handler. Maps AppError / ZodError / unknown to JSON envelopes.
 *  Signature matches Hono's `app.onError((err, c) => ...)`. */
export function errorHandler(err: unknown, c: Context) {
  if (isAppError(err)) {
    if (err.status >= 500) {
      logger.error("app_error", { code: err.code, message: err.message });
    }
    return c.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.status as 400,
    );
  }

  if (err instanceof ZodError) {
    const appErr = AppError.validation("Validation failed", err.flatten());
    return c.json(
      { error: { code: appErr.code, message: appErr.message, details: appErr.details } },
      422,
    );
  }

  logger.error("unhandled_error", {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  return c.json(
    { error: { code: "INTERNAL", message: "Internal server error" } },
    500,
  );
}

/** Simple request logging + timing middleware. */
export async function requestLogger(c: Context, next: Next) {
  const start = performance.now();
  await next();
  const ms = Math.round(performance.now() - start);
  logger.info("request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms,
  });
}
