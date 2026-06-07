import { logger } from "@/shared/logger.ts";
import { buildLlmProvider, type MutableLlmProvider } from "@/ai/llm/index.ts";
import type { GitHubService } from "@/modules/github/github.service.ts";
import {
  saveSettings,
  toLlmConfig,
  type RuntimeSettings,
} from "@/modules/settings/settings.store.ts";
import type {
  PublicGitHubSettings,
  PublicLlmSettings,
  UpdateGitHubSettingsInput,
  UpdateLlmSettingsInput,
} from "@/modules/settings/settings.schema.ts";

export interface TestResult {
  ok: boolean;
  provider: string;
  model: string;
  message: string;
}

/**
 * Owns the live LLM configuration. Updating it persists to disk and hot-swaps the
 * provider inside the shared MutableLlmProvider, so the whole agent team picks up
 * the new model/key immediately (no restart).
 */
export class SettingsService {
  private settings: RuntimeSettings;

  constructor(
    private readonly llm: MutableLlmProvider,
    private readonly github: GitHubService,
    initial: RuntimeSettings,
  ) {
    this.settings = initial;
    this.applyGitHub();
  }

  get(): PublicLlmSettings {
    return toPublicLlm(this.settings);
  }

  getGitHub(): PublicGitHubSettings {
    return toPublicGitHub(this.settings);
  }

  /** The provider/model actually active (mock if a key is missing). */
  effective(): { provider: string; model: string } {
    return { provider: this.llm.name, model: this.llm.model };
  }

  async update(input: UpdateLlmSettingsInput): Promise<PublicLlmSettings> {
    const next = this.mergeLlm(input);
    this.settings = next;
    await saveSettings(next);
    this.llm.setProvider(buildLlmProvider(toLlmConfig(next)));
    logger.info("llm_settings_updated", { provider: next.provider, model: next.models[next.provider] });
    return toPublicLlm(next);
  }

  async updateGitHub(input: UpdateGitHubSettingsInput): Promise<PublicGitHubSettings> {
    const next = this.mergeGitHub(input);
    this.settings = next;
    await saveSettings(next);
    this.applyGitHub();
    logger.info("github_settings_updated", { defaultRepo: next.github.defaultRepo });
    return toPublicGitHub(next);
  }

  async testGitHub(): Promise<{ ok: boolean; message: string; login?: string }> {
    try {
      const { Octokit } = await import("@octokit/rest");
      const token = this.settings.github.token.trim();
      if (!token) return { ok: false, message: "No GitHub token configured" };
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.users.getAuthenticated();
      return { ok: true, message: `Authenticated as ${data.login}`, login: data.login };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }

  async test(input: UpdateLlmSettingsInput): Promise<TestResult> {
    const cfg = toLlmConfig(this.mergeLlm(input));
    const provider = buildLlmProvider(cfg);
    try {
      const text = await provider.generateText({
        system: "You are a connectivity probe.",
        prompt: "Reply with exactly: OK",
        temperature: 0,
        mock: () => "OK",
      });
      return { ok: true, provider: provider.name, model: provider.model, message: text.trim().slice(0, 120) };
    } catch (e) {
      return {
        ok: false,
        provider: provider.name,
        model: provider.model,
        message: e instanceof Error ? e.message : String(e),
      };
    }
  }

  /** Apply an update over the current settings without mutating state (per-provider keys/models). */
  private mergeLlm(input: UpdateLlmSettingsInput): RuntimeSettings {
    const s = this.settings;
    const models = { ...s.models };
    if (input.model?.trim()) models[input.provider] = input.model.trim();

    const keys = { ...s.keys };
    if (input.apiKey?.trim() && (input.provider === "groq" || input.provider === "gemini")) {
      keys[input.provider] = input.apiKey.trim();
    }

    return {
      ...s,
      provider: input.provider,
      baseUrl: input.baseUrl?.trim() ? input.baseUrl.trim() : s.baseUrl,
      models,
      keys,
    };
  }

  private mergeGitHub(input: UpdateGitHubSettingsInput): RuntimeSettings {
    const github = { ...this.settings.github };
    if (input.token?.trim()) github.token = input.token.trim();
    if (input.defaultRepo !== undefined) github.defaultRepo = input.defaultRepo.trim();
    return { ...this.settings, github };
  }

  private applyGitHub(): void {
    this.github.configure({
      token: this.settings.github.token,
      defaultRepo: this.settings.github.defaultRepo,
    });
  }
}

function toPublicLlm(s: RuntimeSettings): PublicLlmSettings {
  const key = s.provider === "groq" ? s.keys.groq : s.provider === "gemini" ? s.keys.gemini : "";
  return {
    provider: s.provider,
    model: s.models[s.provider],
    baseUrl: s.baseUrl,
    hasApiKey: Boolean(key.trim()),
  };
}

function toPublicGitHub(s: RuntimeSettings): PublicGitHubSettings {
  return {
    hasToken: Boolean(s.github.token.trim()),
    defaultRepo: s.github.defaultRepo,
  };
}
