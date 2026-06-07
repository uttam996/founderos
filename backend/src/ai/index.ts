import { createLlmProvider, MutableLlmProvider } from "@/ai/llm/index.ts";
import { createEmbeddingsProvider, type EmbeddingsProvider } from "@/ai/embeddings/index.ts";
import { createAgentTeam, type AgentTeam } from "@/ai/agents/index.ts";
import { Orchestrator } from "@/ai/graph/orchestrator.ts";

export interface AiEngine {
  /** Swappable LLM provider; reconfigure at runtime via the Settings module. */
  llm: MutableLlmProvider;
  embeddings: EmbeddingsProvider;
  team: AgentTeam;
  orchestrator: Orchestrator;
}

/** Composition root for the AI engine (LLM + embeddings + agents + graph). */
export function createAiEngine(): AiEngine {
  const llm = new MutableLlmProvider(createLlmProvider());
  const embeddings = createEmbeddingsProvider();
  const team = createAgentTeam(llm);
  const orchestrator = new Orchestrator(team);
  return { llm, embeddings, team, orchestrator };
}

export { Orchestrator };
export type { PipelineEvent, PipelineEventHandler } from "@/ai/graph/orchestrator.ts";
