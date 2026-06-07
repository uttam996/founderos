import type { LlmProvider, StructuredRequest } from "@/ai/llm/index.ts";
import type { GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";
import { emitAgentEvent } from "@/ai/graph/events.ts";

/**
 * Base class for all agents. Each agent is a LangGraph node: it reads the shared
 * state and returns a partial update. Agents depend on the LlmProvider interface
 * (constructor injection) and never on a concrete LLM implementation.
 */
export abstract class BaseAgent {
  abstract readonly name: string;

  constructor(protected readonly llm: LlmProvider) {}

  /** The graph node entrypoint. */
  abstract run(state: GraphStateType): Promise<GraphUpdate>;

  /** Emit a human-readable progress log (streamed to the UI). */
  protected async log(message: string): Promise<void> {
    await emitAgentEvent(this.name, message);
  }

  protected async toolCall(message: string): Promise<void> {
    await emitAgentEvent(this.name, message, "tool_call");
  }

  /** Structured generation with logging. Uses real LLM or deterministic mock. */
  protected async think<T>(req: StructuredRequest<T>): Promise<T> {
    return this.llm.generateStructured(req);
  }
}
