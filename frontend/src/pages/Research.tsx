import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ProjectSelect } from "@/components/ProjectSelect";
import { PlanCards } from "@/components/PlanCards";
import { Card, CardContent } from "@/components/ui/card";
import type { StartupPlan } from "@/lib/types";

export function Research() {
  const [projectId, setProjectId] = useState("");
  const projects = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });

  useEffect(() => {
    if (!projectId && projects.data?.[0]) setProjectId(projects.data[0].id);
  }, [projects.data, projectId]);

  const research = useQuery({
    queryKey: ["research", projectId],
    queryFn: () => api.getResearch(projectId),
    enabled: !!projectId,
  });

  const hasData = research.data?.market || research.data?.competitors || research.data?.opportunities;

  const partialPlan = {
    id: "",
    projectId,
    runId: null,
    market: research.data?.market ?? null,
    competitors: research.data?.competitors ?? null,
    opportunities: research.data?.opportunities ?? null,
    mvpFeatures: null,
    roadmap: null,
    pricing: null,
    financials: null,
    architecture: null,
    launchPlan: null,
    review: null,
    summary: null,
    createdAt: "",
  } satisfies StartupPlan;

  return (
    <div>
      <PageHeader
        title="Research"
        subtitle="Market, competitor and opportunity analysis from the Research agent."
        action={<ProjectSelect value={projectId} onChange={setProjectId} className="w-56" />}
      />

      {hasData ? (
        <PlanCards plan={partialPlan} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {projectId ? "No research yet. Run the agents for this project." : "Select a project."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
