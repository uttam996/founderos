import { join } from "node:path";
import { env } from "@/config/env.ts";
import { logger } from "@/shared/logger.ts";
import type { LlmConfig, LlmProviderName } from "@/ai/llm/index.ts";

// backend/runtime-settings.json (gitignored — may contain API keys).
const FILE = join(import.meta.dir, "../../../runtime-settings.json");

/**
 * Runtime LLM settings. Keys and models are kept per-provider so switching
 * providers back and forth never loses a previously entered key.
 */
export interface RuntimeSettings {
  provider: LlmProviderName;
  baseUrl: string;
  models: Record<LlmProviderName, string>;
  keys: { groq: string; gemini: string };
  github: { token: string; defaultRepo: string };
}

export function envDefaults(): RuntimeSettings {
  return {
    provider: env.effectiveLlmProvider,
    baseUrl: env.GROQ_BASE_URL,
    models: {
      groq: env.GROQ_MODEL,
      gemini: env.LLM_MODEL,
      mock: "mock-deterministic",
    },
    keys: {
      groq: env.GROQ_API_KEY ?? "",
      gemini: env.GOOGLE_API_KEY ?? "",
    },
    github: {
      token: env.GITHUB_TOKEN ?? "",
      defaultRepo: "",
    },
  };
}

/** The active provider config consumed by buildLlmProvider(). */
export function toLlmConfig(s: RuntimeSettings): LlmConfig {
  return {
    provider: s.provider,
    model: s.models[s.provider],
    baseUrl: s.baseUrl,
    apiKey: s.provider === "groq" ? s.keys.groq : s.provider === "gemini" ? s.keys.gemini : "",
  };
}

export async function loadSettings(): Promise<RuntimeSettings> {
  const base = envDefaults();
  try {
    const file = Bun.file(FILE);
    if (await file.exists()) {
      const data = (await file.json()) as Partial<RuntimeSettings>;
      return {
        provider: data.provider ?? base.provider,
        baseUrl: data.baseUrl ?? base.baseUrl,
        models: { ...base.models, ...data.models },
        keys: { ...base.keys, ...data.keys },
        github: { ...base.github, ...data.github },
      };
    }
  } catch (e) {
    logger.warn("settings_load_failed", { message: e instanceof Error ? e.message : String(e) });
  }
  return base;
}

export async function saveSettings(s: RuntimeSettings): Promise<void> {
  await Bun.write(FILE, JSON.stringify(s, null, 2));
}
