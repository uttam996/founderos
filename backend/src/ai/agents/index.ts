import type { LlmProvider } from "@/ai/llm/index.ts";
import { SupervisorAgent } from "@/ai/agents/supervisor/index.ts";
import { ResearchAgent } from "@/ai/agents/research/index.ts";
import { ProductManagerAgent } from "@/ai/agents/product-manager/index.ts";
import { FinanceAgent } from "@/ai/agents/finance/index.ts";
import { EngineerAgent } from "@/ai/agents/engineer/index.ts";
import { MarketingAgent } from "@/ai/agents/marketing/index.ts";

export interface AgentTeam {
  supervisor: SupervisorAgent;
  research: ResearchAgent;
  productManager: ProductManagerAgent;
  finance: FinanceAgent;
  engineer: EngineerAgent;
  marketing: MarketingAgent;
}

/** Construct the full agent team with the injected LLM provider. */
export function createAgentTeam(llm: LlmProvider): AgentTeam {
  return {
    supervisor: new SupervisorAgent(llm),
    research: new ResearchAgent(llm),
    productManager: new ProductManagerAgent(llm),
    finance: new FinanceAgent(llm),
    engineer: new EngineerAgent(llm),
    marketing: new MarketingAgent(llm),
  };
}

export {
  SupervisorAgent,
  ResearchAgent,
  ProductManagerAgent,
  FinanceAgent,
  EngineerAgent,
  MarketingAgent,
};
