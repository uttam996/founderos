/**
 * pgvector serialization helpers. pgvector accepts a textual representation
 * like '[0.1,0.2,...]' which postgres.js sends as a bound parameter.
 */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export function clampLimit(value: unknown, fallback = 20, max = 100): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}
