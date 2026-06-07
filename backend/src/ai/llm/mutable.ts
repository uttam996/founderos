import type { LlmProvider, StructuredRequest, TextRequest } from "@/ai/llm/provider.ts";

/**
 * A swappable LLM provider. Agents hold a reference to this delegate, so changing
 * the underlying provider at runtime (via the Settings UI) takes effect across
 * the whole agent team immediately, without rebuilding the graph.
 */
export class MutableLlmProvider implements LlmProvider {
  private current: LlmProvider;

  constructor(initial: LlmProvider) {
    this.current = initial;
  }

  get name(): string {
    return this.current.name;
  }

  get model(): string {
    return this.current.model;
  }

  setProvider(provider: LlmProvider): void {
    this.current = provider;
  }

  generateStructured<T>(req: StructuredRequest<T>): Promise<T> {
    return this.current.generateStructured(req);
  }

  generateText(req: TextRequest): Promise<string> {
    return this.current.generateText(req);
  }
}
