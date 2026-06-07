import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";

const EXAMPLES = [
  "Build a Restaurant SaaS",
  "Build a Fleet Management Platform",
  "Build an AI Interview Platform",
  "Build a B2B Invoicing Tool",
];

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [idea, setIdea] = useState("");
  const [name, setName] = useState("");

  const projects = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });

  const create = useMutation({
    mutationFn: async () => {
      const project = await api.createProject({ idea, name: name || undefined });
      await api.runProject(project.id);
      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(`/projects/${project.id}`);
    },
  });

  const recent = projects.data ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Turn a startup idea into a complete operating plan with a team of AI agents."
      />

      <Card className="mb-8 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" /> New Startup Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Project name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Describe your startup idea, e.g. 'Build a Restaurant SaaS'"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setIdea(ex)}
                className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => create.mutate()} disabled={idea.trim().length < 3 || create.isPending}>
              {create.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Launching agents...
                </>
              ) : (
                <>
                  Generate Startup Plan <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            {create.isError && (
              <span className="text-sm text-destructive">
                {(create.error as Error).message}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Projects</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          View all
        </Button>
      </div>

      {recent.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No projects yet. Create your first startup idea above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.slice(0, 6).map((p) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
