import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RunStreamState } from "@/lib/useRunStream";

const AGENTS = [
  { id: "supervisor_agent", label: "Supervisor" },
  { id: "research_agent", label: "Research" },
  { id: "product_agent", label: "Product Manager" },
  { id: "finance_agent", label: "Finance" },
  { id: "engineer_agent", label: "Engineer" },
  { id: "marketing_agent", label: "Marketing" },
  { id: "review_agent", label: "Supervisor Review" },
];

export function AgentActivity({ stream }: { stream: RunStreamState }) {
  const logs = stream.events.filter((e) => e.type === "agent_log");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Agents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {AGENTS.map((a) => {
            const running = stream.active.has(a.id);
            const done = stream.completed.has(a.id);
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2",
                  running && "border-primary/50 bg-primary/5",
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : running ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn("text-sm", done && "text-muted-foreground")}>{a.label}</span>
                {running && (
                  <span className="ml-auto h-2 w-2 animate-pulse-ring rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Live Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] space-y-1.5 overflow-y-auto font-mono text-xs">
            {logs.length === 0 && (
              <div className="text-muted-foreground">Waiting for agent activity...</div>
            )}
            {logs.map((e, i) =>
              e.type === "agent_log" ? (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground">{new Date(e.at).toLocaleTimeString()}</span>
                  <span className="font-semibold text-primary">[{e.agent}]</span>
                  <span>{e.message}</span>
                </div>
              ) : null,
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
