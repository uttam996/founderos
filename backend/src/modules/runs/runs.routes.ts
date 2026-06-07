import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { ok } from "@/shared/http/respond.ts";
import { createSseWriter } from "@/shared/http/sse.ts";
import type { PipelineEvent } from "@/ai/index.ts";
import type { RunsService } from "@/modules/runs/runs.service.ts";
import type { RunHub } from "@/modules/runs/run-hub.ts";

const now = () => new Date().toISOString();

export function runsRoutes(deps: { runs: RunsService; hub: RunHub }) {
  const r = new Hono();

  r.get("/:id", async (c) => ok(c, await deps.runs.get(c.req.param("id"))));

  // Server-Sent Events stream of live pipeline events for a run.
  r.get("/:id/stream", (c) => {
    const runId = c.req.param("id");

    return streamSSE(c, async (stream) => {
      const writer = createSseWriter(stream);
      const queue: PipelineEvent[] = [];
      let wake: (() => void) | null = null;
      let aborted = false;

      const sub = deps.hub.subscribe(runId, (e) => {
        queue.push(e);
        wake?.();
        wake = null;
      });

      // Replay anything emitted before this connection opened.
      queue.unshift(...sub.replay);

      if (sub.closed && queue.length === 0) {
        await writer.send("done", { type: "done", at: now() });
        await writer.close();
        return;
      }

      c.req.raw.signal.addEventListener("abort", () => {
        aborted = true;
        wake?.();
        wake = null;
      });

      try {
        while (!aborted) {
          if (queue.length === 0) {
            if (deps.hub.isClosed(runId)) break;
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
            continue;
          }
          const event = queue.shift()!;
          await writer.send(event.type, event);
          if (event.type === "done" || event.type === "error") break;
        }
      } finally {
        sub.unsubscribe();
        await writer.close();
      }
    });
  });

  return r;
}
