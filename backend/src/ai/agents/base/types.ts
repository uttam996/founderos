import type { LlmProvider } from "@/ai/llm/index.ts";
import type { GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";

/** Dependencies every agent function receives. */
export interface AgentDeps {
  llm: LlmProvider;
}

/** A graph node: a name + one `run(state)` function. */
export interface AgentNode {
  name: string;
  run: (state: GraphStateType) => Promise<GraphUpdate>;
}

/** Supervisor has an extra `review` step after specialists finish. */
export interface SupervisorNode extends AgentNode {
  review: (state: GraphStateType) => Promise<GraphUpdate>;
}

export interface AgentTeam {
  supervisor: SupervisorNode;
  research: AgentNode;
  productManager: AgentNode;
  finance: AgentNode;
  engineer: AgentNode;
  marketing: AgentNode;
}
