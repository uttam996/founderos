import type { PipelineEvent } from "@/ai/index.ts";

interface Channel {
  events: PipelineEvent[];
  subscribers: Set<(e: PipelineEvent) => void>;
  closed: boolean;
}

/**
 * In-memory pub/sub for live run events. A pipeline runs in the background and
 * publishes events here; SSE connections subscribe (and get a replay of any
 * events emitted before they connected). Suitable for a single-instance
 * deployment; swap for Redis pub/sub to scale horizontally.
 */
export class RunHub {
  private channels = new Map<string, Channel>();

  create(runId: string): void {
    if (!this.channels.has(runId)) {
      this.channels.set(runId, { events: [], subscribers: new Set(), closed: false });
    }
  }

  publish(runId: string, event: PipelineEvent): void {
    const ch = this.channels.get(runId);
    if (!ch || ch.closed) return;
    ch.events.push(event);
    for (const sub of ch.subscribers) sub(event);
  }

  /** Subscribe to a run. Replays buffered events, then streams new ones. */
  subscribe(
    runId: string,
    onEvent: (e: PipelineEvent) => void,
  ): { unsubscribe: () => void; replay: PipelineEvent[]; closed: boolean } {
    const ch = this.channels.get(runId);
    if (!ch) return { unsubscribe: () => {}, replay: [], closed: true };
    ch.subscribers.add(onEvent);
    return {
      replay: [...ch.events],
      closed: ch.closed,
      unsubscribe: () => ch.subscribers.delete(onEvent),
    };
  }

  close(runId: string): void {
    const ch = this.channels.get(runId);
    if (ch) ch.closed = true;
    // Retain the buffer briefly so late subscribers can replay, then GC.
    setTimeout(() => this.channels.delete(runId), 60_000);
  }

  isClosed(runId: string): boolean {
    return this.channels.get(runId)?.closed ?? true;
  }
}
