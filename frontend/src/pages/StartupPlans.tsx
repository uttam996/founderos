import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ProjectSelect } from "@/components/ProjectSelect";
import { PlanCards } from "@/components/PlanCards";
import { Card, CardContent } from "@/components/ui/card";

export function StartupPlans() {
  const params = useParams();
  const [selected, setSelected] = useState("");
  const projects = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });

  const projectId = params.id ?? selected;

  useEffect(() => {
    if (!params.id && !selected && projects.data?.[0]) setSelected(projects.data[0].id);
  }, [projects.data, selected, params.id]);

  const plan = useQuery({
    queryKey: ["plan", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      try {
        return await api.getPlan(projectId);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });

  return (
    <div>
      <PageHeader
        title="Startup Plans"
        subtitle="The consolidated operating plan produced by the agent team."
        action={
          !params.id ? <ProjectSelect value={selected} onChange={setSelected} className="w-56" /> : undefined
        }
      />

      {plan.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : plan.data ? (
        <PlanCards plan={plan.data} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {projectId ? "No plan yet. Run the agents for this project." : "Select a project."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
