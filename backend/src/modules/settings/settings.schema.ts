import { z } from "zod";

export const UpdateLlmSettingsSchema = z.object({
  provider: z.enum(["groq", "gemini", "mock"]),
  model: z.string().trim().max(120).optional(),
  // Allow a full URL or empty string (keep current / not applicable).
  baseUrl: z.string().trim().url().or(z.literal("")).optional(),
  // Empty means "keep the existing key" for the same provider.
  apiKey: z.string().trim().max(400).optional(),
});
export type UpdateLlmSettingsInput = z.infer<typeof UpdateLlmSettingsSchema>;

export const UpdateGitHubSettingsSchema = z.object({
  token: z.string().trim().max(400).optional(),
  defaultRepo: z
    .string()
    .trim()
    .regex(/^[\w.-]+\/[\w.-]+$/, "Expected owner/repo")
    .or(z.literal(""))
    .optional(),
});
export type UpdateGitHubSettingsInput = z.infer<typeof UpdateGitHubSettingsSchema>;

/** Public view of the LLM settings — never exposes the raw API key. */
export interface PublicLlmSettings {
  provider: "groq" | "gemini" | "mock";
  model: string;
  baseUrl: string;
  hasApiKey: boolean;
}

export interface PublicGitHubSettings {
  hasToken: boolean;
  defaultRepo: string;
}
