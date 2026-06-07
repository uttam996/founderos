import { sql } from "@/shared/db/client.ts";
import { createAiEngine, type AiEngine } from "@/ai/index.ts";
import { buildLlmProvider } from "@/ai/llm/index.ts";
import { loadSettings, toLlmConfig } from "@/modules/settings/settings.store.ts";
import { SettingsService } from "@/modules/settings/settings.service.ts";

import { ProjectsRepository } from "@/modules/projects/projects.repository.ts";
import { ProjectsService } from "@/modules/projects/projects.service.ts";
import { PlansRepository } from "@/modules/plans/plans.repository.ts";
import { PlansService } from "@/modules/plans/plans.service.ts";
import { TasksRepository } from "@/modules/tasks/tasks.repository.ts";
import { TasksService } from "@/modules/tasks/tasks.service.ts";
import { MemoryRepository } from "@/modules/memory/memory.repository.ts";
import { MemoryService } from "@/modules/memory/memory.service.ts";
import { RunsRepository } from "@/modules/runs/runs.repository.ts";
import { RunsService } from "@/modules/runs/runs.service.ts";
import { RunHub } from "@/modules/runs/run-hub.ts";
import { GitHubService } from "@/modules/github/github.service.ts";
import { AutonomyService } from "@/modules/autonomy/autonomy.service.ts";

/**
 * The application container. This is the single composition root: it constructs
 * repositories, services and the AI engine and wires their dependencies via
 * constructor injection. Routes receive only the services they need.
 */
export interface Container {
  ai: AiEngine;
  hub: RunHub;
  projects: ProjectsService;
  plans: PlansService;
  tasks: TasksService;
  memory: MemoryService;
  runs: RunsService;
  settings: SettingsService;
  github: GitHubService;
  autonomy: AutonomyService;
}

export async function buildContainer(): Promise<Container> {
  const ai = createAiEngine();
  const hub = new RunHub();

  // Apply any persisted runtime LLM config (Settings UI) over the env default.
  const runtimeSettings = await loadSettings();
  ai.llm.setProvider(buildLlmProvider(toLlmConfig(runtimeSettings)));
  const github = new GitHubService();
  github.configure({
    token: runtimeSettings.github.token,
    defaultRepo: runtimeSettings.github.defaultRepo,
  });
  const settings = new SettingsService(ai.llm, github, runtimeSettings);

  const projects = new ProjectsService(new ProjectsRepository(sql));
  const plans = new PlansService(new PlansRepository(sql));
  const tasks = new TasksService(new TasksRepository(sql));
  const memory = new MemoryService(new MemoryRepository(sql), ai.embeddings);
  const runsRepo = new RunsRepository(sql);

  const runs = new RunsService({
    orchestrator: ai.orchestrator,
    runsRepo,
    hub,
    projects,
    plans,
    tasks,
    memory,
  });

  return {
    ai,
    hub,
    projects,
    plans,
    tasks,
    memory,
    runs,
    settings,
    github,
    autonomy: new AutonomyService(),
  };
}
