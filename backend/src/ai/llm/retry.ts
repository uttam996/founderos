import { logger } from "@/shared/logger.ts";

export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  label?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Exponential backoff with jitter. Retries transient failures (rate limits,
 * 5xx, network) up to `retries` times.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 3, baseMs = 400, maxMs = 8000, label = "llm" } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      const backoff = Math.min(maxMs, baseMs * 2 ** attempt);
      const jitter = Math.random() * backoff * 0.25;
      // Respect provider rate-limit hints ("try again in 2.03s") so we don't
      // waste attempts retrying before the window resets.
      const retryAfter = parseRetryAfterMs(e);
      const delay = retryAfter ?? Math.round(backoff + jitter);
      logger.warn("retry", {
        label,
        attempt: attempt + 1,
        delay,
        message: e instanceof Error ? e.message : String(e),
      });
      await sleep(delay);
    }
  }
  throw lastErr;
}

/** Extract a wait hint (ms) from a rate-limit error like "try again in 2.03s". */
export function parseRetryAfterMs(e: unknown): number | null {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.match(/try again in ([\d.]+)\s*s/i);
  if (!m) return null;
  const seconds = Number(m[1]);
  if (!Number.isFinite(seconds)) return null;
  return Math.min(15_000, Math.round(seconds * 1000) + 300);
}
