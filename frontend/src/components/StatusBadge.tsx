import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/lib/types";

const map: Record<ProjectStatus, { variant: "secondary" | "warning" | "success" | "destructive"; label: string }> = {
  draft: { variant: "secondary", label: "Draft" },
  running: { variant: "warning", label: "Running" },
  ready: { variant: "success", label: "Ready" },
  error: { variant: "destructive", label: "Error" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = map[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
