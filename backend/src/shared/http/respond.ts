import type { Context } from "hono";

/** Consistent success envelope. */
export function ok<T>(c: Context, data: T, status = 200) {
  return c.json({ data }, status as 200);
}

/** Consistent created envelope. */
export function created<T>(c: Context, data: T) {
  return c.json({ data }, 201);
}
