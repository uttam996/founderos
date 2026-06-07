import { useEffect, useRef, useState } from "react";
import type { PipelineEvent } from "@/lib/types";

export type RunStatus = "idle" | "streaming" | "done" | "error";

const EVENT_TYPES = ["run_start", "node_start", "node_complete", "agent_log", "done", "error"];

export interface RunStreamState {
  events: PipelineEvent[];
  status: RunStatus;
  /** node ids currently running (started but not completed). */
  active: Set<string>;
  completed: Set<string>;
  error: string | null;
}

/**
 * Subscribes to a run's SSE stream and accumulates pipeline events. Calls
 * `onDone` once when the pipeline finishes so the caller can refetch results.
 */
export function useRunStream(runId: string | null, onDone?: () => void) {
  const [state, setState] = useState<RunStreamState>({
    events: [],
    status: "idle",
    active: new Set(),
    completed: new Set(),
    error: null,
  });
  const doneRef = useRef(false);

  useEffect(() => {
    if (!runId) return;
    doneRef.current = false;
    setState({ events: [], status: "streaming", active: new Set(), completed: new Set(), error: null });

    const es = new EventSource(`/api/runs/${runId}/stream`);

    const handle = (e: MessageEvent) => {
      let payload: PipelineEvent;
      try {
        payload = JSON.parse(e.data);
      } catch {
        return;
      }
      setState((prev) => {
        const active = new Set(prev.active);
        const completed = new Set(prev.completed);
        if (payload.type === "node_start") active.add(payload.node);
        if (payload.type === "node_complete") {
          active.delete(payload.node);
          completed.add(payload.node);
        }
        const status: RunStatus =
          payload.type === "done" ? "done" : payload.type === "error" ? "error" : prev.status;
        return {
          events: [...prev.events, payload],
          status,
          active,
          completed,
          error: payload.type === "error" ? payload.message : prev.error,
        };
      });

      if ((payload.type === "done" || payload.type === "error") && !doneRef.current) {
        doneRef.current = true;
        es.close();
        onDone?.();
      }
    };

    for (const t of EVENT_TYPES) es.addEventListener(t, handle as EventListener);
    es.onerror = () => {
      // If the stream drops without a terminal event, surface it once.
      if (!doneRef.current) {
        doneRef.current = true;
        es.close();
        setState((prev) => (prev.status === "streaming" ? { ...prev, status: "done" } : prev));
        onDone?.();
      }
    };

    return () => {
      doneRef.current = true;
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  return state;
}
