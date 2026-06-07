import { z } from "zod";

/**
 * Zod-validated environment. All external configuration enters the app here.
 * The system is designed to run with ZERO secrets: when no GOOGLE_API_KEY is
 * present we transparently fall back to the deterministic mock LLM/embeddings.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  DATABASE_URL: z
    .string()
    .default("postgres://founderos:founderos@localhost:5432/founderos"),

  LLM_PROVIDER: z.enum(["gemini", "groq", "mock"]).optional(),
  LLM_MODEL: z.string().default("gemini-1.5-flash"),
  EMBEDDING_MODEL: z.string().default("text-embedding-004"),
  EMBEDDING_DIM: z.coerce.number().int().positive().default(768),
  GOOGLE_API_KEY: z.string().optional(),

  // Groq (OpenAI-compatible API)
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.string().default("https://api.groq.com/openai/v1"),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  LANGCHAIN_TRACING_V2: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().default("founderos"),

  GITHUB_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema> & {
  /** Resolved effective provider after applying fallback rules. */
  effectiveLlmProvider: "gemini" | "groq" | "mock";
};

function load(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;

  const hasGoogleKey = Boolean(env.GOOGLE_API_KEY?.trim());
  const hasGroqKey = Boolean(env.GROQ_API_KEY?.trim());

  const effectiveLlmProvider = resolveProvider(env.LLM_PROVIDER, hasGoogleKey, hasGroqKey);

  return { ...env, effectiveLlmProvider };
}

/**
 * Provider precedence:
 * - explicit LLM_PROVIDER wins, but degrades to mock if its key is missing;
 * - otherwise auto-pick: groq > gemini > mock based on available keys.
 */
function resolveProvider(
  requested: Env["LLM_PROVIDER"],
  hasGoogleKey: boolean,
  hasGroqKey: boolean,
): "gemini" | "groq" | "mock" {
  if (requested === "mock") return "mock";
  if (requested === "groq") return hasGroqKey ? "groq" : "mock";
  if (requested === "gemini") return hasGoogleKey ? "gemini" : "mock";
  if (hasGroqKey) return "groq";
  if (hasGoogleKey) return "gemini";
  return "mock";
}

export const env: Env = load();
export const isMockMode = env.effectiveLlmProvider === "mock";
