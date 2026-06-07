import { Annotation } from "@langchain/langgraph";
import type {
  SupervisorPlan,
  MarketAnalysis,
  CompetitorAnalysis,
  Opportunities,
  ProductOutput,
  PricingStrategy,
  Financials,
  Architecture,
  GeneratedTask,
  LaunchPlan,
  FinalReview,
} from "@/ai/schemas.ts";

/** A single human-readable event emitted by an agent during execution. */
export interface AgentEvent {
  agent: string;
  type: "node_start" | "node_complete" | "agent_log" | "tool_call";
  message: string;
  at: string;
}

const replace = <T>() =>
  Annotation<T | null>({ reducer: (_prev, next) => next, default: () => null });

/**
 * Shared LangGraph state. The five specialist agents run in parallel and each
 * writes to disjoint channels (last-write-wins). `events` and `tasks` use
 * append reducers so concurrent writes merge instead of conflict.
 */
export const GraphState = Annotation.Root({
  projectId: Annotation<string>({ reducer: (_p, n) => n, default: () => "" }),
  idea: Annotation<string>({ reducer: (_p, n) => n, default: () => "" }),

  plan: replace<SupervisorPlan>(),
  market: replace<MarketAnalysis>(),
  competitors: replace<CompetitorAnalysis>(),
  opportunities: replace<Opportunities>(),
  product: replace<ProductOutput>(),
  pricing: replace<PricingStrategy>(),
  financials: replace<Financials>(),
  architecture: replace<Architecture>(),
  launchPlan: replace<LaunchPlan>(),
  review: replace<FinalReview>(),
  summary: Annotation<string>({ reducer: (_p, n) => n, default: () => "" }),

  tasks: Annotation<GeneratedTask[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  events: Annotation<AgentEvent[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
});

export type GraphStateType = typeof GraphState.State;
export type GraphUpdate = Partial<GraphStateType>;
