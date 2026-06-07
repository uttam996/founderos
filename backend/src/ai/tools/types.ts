import type { z } from "zod";

/**
 * Lightweight tool abstraction. Each tool is a named, typed capability an agent
 * can invoke. Tools are deterministic and side-effect-free here so the system
 * works fully offline; swapping in a real web-search API only means replacing
 * a single tool's `invoke` body.
 */
export interface Tool<I, O> {
  name: string;
  description: string;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  invoke(input: I): Promise<O>;
}

export function defineTool<I, O>(tool: Tool<I, O>): Tool<I, O> {
  return tool;
}

/** Deterministic pseudo-random in [0,1) seeded by a string (for stable demos). */
export function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Extract a short, human label from a raw idea string. */
export function ideaLabel(idea: string): string {
  return idea.replace(/^build (an?|the)\s+/i, "").replace(/\.$/, "").trim() || idea.trim();
}
