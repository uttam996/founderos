import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";
import type { AgentEvent } from "@/ai/graph/state.ts";

export const FOUNDEROS_EVENT = "founderos_event";

/**
 * Emit a custom event from inside a graph node. These surface through
 * `graph.streamEvents(..., { version: "v2" })` as `on_custom_event` and are
 * forwarded to the browser over SSE.
 */
export async function emitAgentEvent(
  agent: string,
  message: string,
  type: AgentEvent["type"] = "agent_log",
): Promise<void> {
  const payload: AgentEvent = { agent, type, message, at: new Date().toISOString() };
  try {
    await dispatchCustomEvent(FOUNDEROS_EVENT, payload);
  } catch {
    // Dispatching requires an active callback manager; ignore when absent.
  }
}
