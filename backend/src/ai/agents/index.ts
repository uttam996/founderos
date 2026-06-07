import type { LlmProvider } from "@/ai/llm/index.ts";
import type { AgentDeps, AgentTeam } from "@/ai/agents/base/types.ts";
import { createSupervisorAgent } from "@/ai/agents/supervisor/index.ts";
import { createResearchAgent } from "@/ai/agents/research/index.ts";
import { createProductManagerAgent } from "@/ai/agents/product-manager/index.ts";
import { createFinanceAgent } from "@/ai/agents/finance/index.ts";
import { createEngineerAgent } from "@/ai/agents/engineer/index.ts";
import { createMarketingAgent } from "@/ai/agents/marketing/index.ts";

export type { AgentDeps, AgentNode, SupervisorNode, AgentTeam } from "@/ai/agents/base/types.ts";
export { agentLog, agentThink, agentToolCall } from "@/ai/agents/base/helpers.ts";

/** Wire all agents with the shared LLM dependency. Each agent is just `{ name, run }`. */
export function createAgentTeam(llm: LlmProvider): AgentTeam {
  const deps: AgentDeps = { llm };
  return {
    supervisor: createSupervisorAgent(deps),
    research: createResearchAgent(deps),
    productManager: createProductManagerAgent(deps),
    finance: createFinanceAgent(deps),
    engineer: createEngineerAgent(deps),
    marketing: createMarketingAgent(deps),
  };
}

export {
  createSupervisorAgent,
  createResearchAgent,
  createProductManagerAgent,
  createFinanceAgent,
  createEngineerAgent,
  createMarketingAgent,
};
