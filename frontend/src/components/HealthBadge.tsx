import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function HealthBadge() {
  const { data } = useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 15000 });

  const dbOk = data?.db;
  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-3 text-xs">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            data ? (dbOk ? "bg-emerald-400" : "bg-amber-400") : "bg-muted-foreground",
          )}
        />
        <span className="font-medium">{data ? (dbOk ? "Connected" : "DB offline") : "Connecting..."}</span>
      </div>
      {data && (
        <div className="mt-2 space-y-0.5 text-muted-foreground">
          <div>LLM: {data.llm.provider} ({data.llm.model})</div>
          <div>Embeddings: {data.embeddings.provider}</div>
        </div>
      )}
    </div>
  );
}
