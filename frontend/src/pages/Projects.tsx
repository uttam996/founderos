import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

export function Projects() {
  const navigate = useNavigate();
  const projects = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="All your startup projects."
        action={
          <Button onClick={() => navigate("/")}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      {projects.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (projects.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No projects yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(projects.data ?? []).map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <CardContent className="pt-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-medium">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.idea}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
