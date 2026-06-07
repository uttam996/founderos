import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import type { ValidationTargets } from "hono";

/**
 * Wrapper around @hono/zod-validator that emits our standard error envelope
 * ({ error: { code, message, details } }) on validation failure, instead of the
 * library default.
 */
export function validate<T extends ZodSchema>(
  target: keyof ValidationTargets,
  schema: T,
) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION",
            message: "Validation failed",
            details: result.error.flatten(),
          },
        },
        422,
      );
    }
  });
}
