import type { LlmProvider, StructuredRequest } from "@/ai/llm/index.ts";
import { emitAgentEvent } from "@/ai/graph/events.ts";

/** Stream a progress message to the UI. */
export async function agentLog(agent: string, message: string): Promise<void> {
  await emitAgentEvent(agent, message);
}

/** Stream a tool-use message to the UI. */
export async function agentToolCall(agent: string, message: string): Promise<void> {
  await emitAgentEvent(agent, message, "tool_call");
}

/** Call the LLM and return validated structured output. */
export async function agentThink<T>(llm: LlmProvider, req: StructuredRequest<T>): Promise<T> {
  return llm.generateStructured(req);
}
