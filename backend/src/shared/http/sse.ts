import type { SSEStreamingApi } from "hono/streaming";

/**
 * Thin typed wrapper over Hono's SSE stream. Each event is written as a named
 * SSE event with a JSON payload so the browser EventSource can route by type.
 */
export interface SseWriter {
  send(event: string, data: unknown): Promise<void>;
  comment(text: string): Promise<void>;
  close(): Promise<void>;
}

export function createSseWriter(stream: SSEStreamingApi): SseWriter {
  let id = 0;
  return {
    async send(event, data) {
      await stream.writeSSE({
        id: String(id++),
        event,
        data: JSON.stringify(data),
      });
    },
    async comment(text) {
      await stream.write(`: ${text}\n\n`);
    },
    async close() {
      await stream.close();
    },
  };
}
