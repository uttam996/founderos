import type {
  Project,
  StartupPlan,
  Task,
  MemoryHit,
  Health,
  LlmSettings,
  LlmSettingsResponse,
  UpdateLlmSettings,
  LlmTestResult,
  GitHubSettings,
  GitHubSyncResult,
} from "@/lib/types";

const BASE = "/api";

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path.startsWith("/api") ? path : `${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = body?.error;
    throw new ApiError(err?.message ?? "Request failed", res.status, err?.code);
  }
  return (body.data ?? body) as T;
}

export const api = {
  health: () => request<Health>("/health"),

  listProjects: () => request<Project[]>("/projects"),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  createProject: (input: { name?: string; idea: string }) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(input) }),
  runProject: (id: string) =>
    request<{ runId: string }>(`/projects/${id}/run`, { method: "POST" }),

  getPlan: (id: string) => request<StartupPlan>(`/projects/${id}/plan`),
  getPlanHistory: (id: string) => request<StartupPlan[]>(`/projects/${id}/plans`),
  getTasks: (id: string) => request<Task[]>(`/projects/${id}/tasks`),
  getResearch: (id: string) =>
    request<Pick<StartupPlan, "market" | "competitors" | "opportunities">>(
      `/projects/${id}/research`,
    ),

  updateTask: (id: string, patch: Partial<Pick<Task, "status" | "priority" | "title" | "description">>) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  searchMemory: (input: { query: string; projectId?: string; limit?: number }) =>
    request<MemoryHit[]>("/memory/search", { method: "POST", body: JSON.stringify(input) }),

  getSettings: () => request<LlmSettingsResponse>("/settings/llm"),
  updateSettings: (input: UpdateLlmSettings) =>
    request<LlmSettings>("/settings/llm", { method: "PUT", body: JSON.stringify(input) }),
  testSettings: (input: UpdateLlmSettings) =>
    request<LlmTestResult>("/settings/llm/test", { method: "POST", body: JSON.stringify(input) }),

  getGitHubSettings: () => request<GitHubSettings>("/settings/github"),
  updateGitHubSettings: (input: { token?: string; defaultRepo?: string }) =>
    request<GitHubSettings>("/settings/github", { method: "PUT", body: JSON.stringify(input) }),
  testGitHubSettings: () =>
    request<{ ok: boolean; message: string; login?: string }>("/settings/github/test", {
      method: "POST",
    }),
  syncTasksToGitHub: (projectId: string, repo?: string) =>
    request<GitHubSyncResult>(`/github/projects/${projectId}/sync`, {
      method: "POST",
      body: JSON.stringify(repo ? { repo } : {}),
    }),
};

export { ApiError };
