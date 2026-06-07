import { buildWorkflow, NODE_LABELS, type CompiledWorkflow } from "@/ai/graph/workflow.ts";
import { FOUNDEROS_EVENT } from "@/ai/graph/events.ts";
import type { AgentTeam } from "@/ai/agents/index.ts";
import type { AgentEvent, GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";
import { logger } from "@/shared/logger.ts";

const log = logger.child("orchestrator");

/** Events streamed to the client over SSE during a pipeline run. */
export type PipelineEvent =
  | { type: "run_start"; idea: string; at: string }
  | { type: "node_start"; node: string; label: string; at: string }
  | { type: "node_complete"; node: string; label: string; at: string }
  | { type: "agent_log"; agent: string; message: string; kind: AgentEvent["type"]; at: string }
  | { type: "done"; at: string }
  | { type: "error"; message: string; at: string };

export type PipelineEventHandler = (e: PipelineEvent) => void | Promise<void>;

const now = () => new Date().toISOString();

/**
 * Orchestrates a single run of the multi-agent graph, translating LangGraph's
 * low-level `streamEvents` into high-level FounderOS pipeline events and
 * assembling the final consolidated state.
 */
export class Orchestrator {
  private readonly graph: CompiledWorkflow;

  constructor(team: AgentTeam) {
    this.graph = buildWorkflow(team);
  }

  async run(
    input: { projectId: string; idea: string },
    onEvent: PipelineEventHandler,
  ): Promise<GraphStateType> {
    await onEvent({ type: "run_start", idea: input.idea, at: now() });

    const started = new Set<string>();
    const completed = new Set<string>();
    const updates: GraphUpdate[] = [];

    const stream = this.graph.streamEvents(
      { projectId: input.projectId, idea: input.idea },
      { version: "v2", recursionLimit: 25 },
    );

    for await (const ev of stream) {
      const nodeId = (ev.name ?? "") as string;
      const isNode = Boolean(NODE_LABELS[nodeId]) && ev.metadata?.langgraph_node === nodeId;

      if (ev.event === "on_chain_start" && isNode && !started.has(nodeId)) {
        started.add(nodeId);
        await onEvent({ type: "node_start", node: nodeId, label: NODE_LABELS[nodeId]!, at: now() });
      } else if (ev.event === "on_chain_end" && isNode && !completed.has(nodeId)) {
        completed.add(nodeId);
        const output = ev.data?.output as GraphUpdate | undefined;
        if (output) updates.push(output);
        await onEvent({ type: "node_complete", node: nodeId, label: NODE_LABELS[nodeId]!, at: now() });
      } else if (ev.event === "on_custom_event" && ev.name === FOUNDEROS_EVENT) {
        const p = ev.data as AgentEvent;
        await onEvent({ type: "agent_log", agent: p.agent, message: p.message, kind: p.type, at: p.at });
      }
    }

    const finalState = mergeUpdates(input, updates);
    await onEvent({ type: "done", at: now() });
    log.info("run_complete", { projectId: input.projectId, nodes: completed.size });
    return finalState;
  }
}

/** Reduce all node outputs into a single final state (mirrors graph reducers). */
function mergeUpdates(
  input: { projectId: string; idea: string },
  updates: GraphUpdate[],
): GraphStateType {
  const state: GraphStateType = {
    projectId: input.projectId,
    idea: input.idea,
    plan: null,
    market: null,
    competitors: null,
    opportunities: null,
    product: null,
    pricing: null,
    financials: null,
    architecture: null,
    launchPlan: null,
    review: null,
    summary: "",
    tasks: [],
    events: [],
  };

  for (const u of updates) {
    for (const [key, value] of Object.entries(u) as [keyof GraphUpdate, unknown][]) {
      if (value === undefined) continue;
      if (key === "tasks") {
        state.tasks = state.tasks.concat(value as GraphStateType["tasks"]);
      } else if (key === "events") {
        state.events = state.events.concat(value as GraphStateType["events"]);
      } else {
        (state as Record<string, unknown>)[key] = value;
      }
    }
  }
  return state;
}
