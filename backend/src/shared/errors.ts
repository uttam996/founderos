/**
 * Typed application errors. Services and routes throw these; the central
 * error handler in app.ts maps them to HTTP responses.
 */
export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NOT_IMPLEMENTED"
  | "UPSTREAM"
  | "INTERNAL";

const statusByCode: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
  NOT_IMPLEMENTED: 501,
  UPSTREAM: 502,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = statusByCode[code];
    this.details = details;
  }

  static notFound(message = "Resource not found", details?: unknown) {
    return new AppError("NOT_FOUND", message, details);
  }
  static badRequest(message = "Bad request", details?: unknown) {
    return new AppError("BAD_REQUEST", message, details);
  }
  static validation(message = "Validation failed", details?: unknown) {
    return new AppError("VALIDATION", message, details);
  }
  static conflict(message = "Conflict", details?: unknown) {
    return new AppError("CONFLICT", message, details);
  }
  static notImplemented(message = "Not implemented", details?: unknown) {
    return new AppError("NOT_IMPLEMENTED", message, details);
  }
  static upstream(message = "Upstream error", details?: unknown) {
    return new AppError("UPSTREAM", message, details);
  }
  static internal(message = "Internal error", details?: unknown) {
    return new AppError("INTERNAL", message, details);
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
