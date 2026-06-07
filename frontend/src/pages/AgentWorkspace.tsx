import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Loader2, RefreshCw, ListChecks } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useRunStream } from "@/lib/useRunStream";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { AgentActivity } from "@/components/AgentActivity";
import { PlanCards } from "@/components/PlanCards";

export function AgentWorkspace() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [runId, setRunId] = useState<string | null>(null);

  const project = useQuery({ queryKey: ["project", id], queryFn: () => api.getProject(id), enabled: !!id });

  const plan = useQuery({
    queryKey: ["plan", id],
    enabled: !!id,
    queryFn: async () => {
      try {
        return await api.getPlan(id);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });

  const stream = useRunStream(runId, () => {
    queryClient.invalidateQueries({ queryKey: ["plan", id] });
    queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    queryClient.invalidateQueries({ queryKey: ["project", id] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  });

  const startRun = async () => {
    const { runId } = await api.runProject(id);
    setRunId(runId);
  };

  const isStreaming = stream.status === "streaming";

  return (
    <div>
      <PageHeader
        title={project.data?.name ?? "Agent Workspace"}
        subtitle={project.data?.idea}
        action={
          <div className="flex items-center gap-2">
            {project.data && <StatusBadge status={project.data.status} />}
            <Button onClick={startRun} disabled={isStreaming}>
              {isStreaming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Running...
                </>
              ) : plan.data ? (
                <>
                  <RefreshCw className="h-4 w-4" /> Re-run Agents
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Run Agents
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/tasks")}>
              <ListChecks className="h-4 w-4" /> Tasks
            </Button>
          </div>
        }
      />

      {(isStreaming || stream.events.length > 0) && (
        <div className="mb-6">
          <AgentActivity stream={stream} />
        </div>
      )}

      {plan.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading plan...</p>
      ) : plan.data ? (
        <PlanCards plan={plan.data} />
      ) : !isStreaming ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              No plan yet. Run the agent team to generate a full startup plan.
            </p>
            <Button onClick={startRun}>
              <Play className="h-4 w-4" /> Run Agents
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
