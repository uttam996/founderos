import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "@/ai/graph/state.ts";
import type { AgentTeam } from "@/ai/agents/index.ts";

/**
 * The FounderOS multi-agent workflow.
 *
 *   START -> supervisor -> { research, product, finance, engineer, marketing }
 *         -> review -> END
 *
 * The five specialists fan out from the supervisor and run in parallel within a
 * single LangGraph superstep. `review` has five incoming edges, so it only runs
 * once all specialists have finished (a natural join/barrier).
 */
export function buildWorkflow(team: AgentTeam) {
  // Node ids are suffixed with "_agent" to avoid clashing with state channel
  // names (e.g. the "product" / "review" channels).
  const graph = new StateGraph(GraphState)
    .addNode("supervisor_agent", (s) => team.supervisor.run(s))
    .addNode("research_agent", (s) => team.research.run(s))
    .addNode("product_agent", (s) => team.productManager.run(s))
    .addNode("finance_agent", (s) => team.finance.run(s))
    .addNode("engineer_agent", (s) => team.engineer.run(s))
    .addNode("marketing_agent", (s) => team.marketing.run(s))
    .addNode("review_agent", (s) => team.supervisor.review(s))
    .addEdge(START, "supervisor_agent")
    .addEdge("supervisor_agent", "research_agent")
    .addEdge("supervisor_agent", "product_agent")
    .addEdge("supervisor_agent", "finance_agent")
    .addEdge("supervisor_agent", "engineer_agent")
    .addEdge("supervisor_agent", "marketing_agent")
    .addEdge("research_agent", "review_agent")
    .addEdge("product_agent", "review_agent")
    .addEdge("finance_agent", "review_agent")
    .addEdge("engineer_agent", "review_agent")
    .addEdge("marketing_agent", "review_agent")
    .addEdge("review_agent", END);

  return graph.compile();
}

export type CompiledWorkflow = ReturnType<typeof buildWorkflow>;

/** Maps internal graph node ids to friendly agent labels for the UI. */
export const NODE_LABELS: Record<string, string> = {
  supervisor_agent: "Supervisor",
  research_agent: "Research Agent",
  product_agent: "Product Manager Agent",
  finance_agent: "Finance Agent",
  engineer_agent: "Engineer Agent",
  marketing_agent: "Marketing Agent",
  review_agent: "Supervisor Review",
};
