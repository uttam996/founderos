import {
  TrendingUp,
  Swords,
  Lightbulb,
  Layers,
  Cpu,
  DollarSign,
  LineChart,
  Map as MapIcon,
  Megaphone,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StartupPlan } from "@/lib/types";

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-3 space-y-0 border-b border-border/50 bg-card/60">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-5 text-sm">{children}</CardContent>
    </Card>
  );
}

const priorityVariant: Record<string, "default" | "warning" | "secondary"> = {
  must: "default",
  should: "warning",
  could: "secondary",
  wont: "secondary",
};

export function PlanCards({ plan }: { plan: StartupPlan }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {plan.summary && (
        <Card className="lg:col-span-2 border-primary/30 bg-primary/5">
          <CardContent className="pt-5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Executive Summary
            </div>
            <p className="text-sm leading-relaxed">{plan.summary}</p>
          </CardContent>
        </Card>
      )}

      {plan.market && (
        <SectionCard icon={TrendingUp} title="Market Research">
          <p className="mb-3 text-muted-foreground">{plan.market.summary}</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{plan.market.marketSize}</Badge>
            <Badge variant="success">{plan.market.growthRate}</Badge>
          </div>
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Segments</div>
          <ul className="mb-3 space-y-1">
            {plan.market.segments.map((s) => (
              <li key={s.name}>
                <span className="font-medium">{s.name}</span> — {s.description}
              </li>
            ))}
          </ul>
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Trends</div>
          <div className="flex flex-wrap gap-2">
            {plan.market.trends.map((t) => (
              <Badge key={t} variant="outline">{t}</Badge>
            ))}
          </div>
        </SectionCard>
      )}

      {plan.competitors && (
        <SectionCard icon={Swords} title="Competitor Analysis">
          <p className="mb-3 text-muted-foreground">{plan.competitors.positioning}</p>
          <div className="space-y-3">
            {plan.competitors.competitors.map((c) => (
              <div key={c.name} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="secondary">{c.pricing}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-emerald-400">Strengths:</span> {c.strengths.join(", ")}
                  </div>
                  <div>
                    <span className="text-amber-400">Weaknesses:</span> {c.weaknesses.join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {plan.opportunities && (
        <SectionCard icon={Lightbulb} title="Opportunities">
          <ul className="space-y-2">
            {plan.opportunities.opportunities.map((o) => (
              <li key={o.title} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{o.title}</span>
                  <Badge variant={o.impact === "high" ? "success" : "secondary"}>{o.impact}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{o.rationale}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {plan.mvpFeatures && (
        <SectionCard icon={Layers} title="MVP Features">
          <ul className="space-y-2">
            {plan.mvpFeatures.map((f) => (
              <li key={f.name} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3">
                <div>
                  <div className="font-medium">{f.name}</div>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={priorityVariant[f.priority] ?? "secondary"}>{f.priority}</Badge>
                  <span className="text-xs text-muted-foreground">{f.effort}</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {plan.architecture && (
        <SectionCard icon={Cpu} title="Technical Architecture">
          <p className="mb-3 text-muted-foreground">{plan.architecture.overview}</p>
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Frontend:</span> {plan.architecture.stack.frontend}</div>
            <div><span className="text-muted-foreground">Backend:</span> {plan.architecture.stack.backend}</div>
            <div><span className="text-muted-foreground">Database:</span> {plan.architecture.stack.database}</div>
            <div><span className="text-muted-foreground">Infra:</span> {plan.architecture.stack.infra}</div>
          </div>
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Key APIs</div>
          <div className="space-y-1 font-mono text-xs">
            {plan.architecture.apis.slice(0, 6).map((a) => (
              <div key={a.path} className="flex gap-2">
                <span className="w-14 shrink-0 font-semibold text-primary">{a.method}</span>
                <span className="text-muted-foreground">{a.path}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {plan.pricing && (
        <SectionCard icon={DollarSign} title="Pricing Model">
          <p className="mb-3 text-muted-foreground">{plan.pricing.model}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {plan.pricing.tiers.map((t) => (
              <div key={t.name} className="rounded-lg border border-border/60 p-3">
                <div className="font-medium">{t.name}</div>
                <div className="text-lg font-semibold text-primary">{t.price}</div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {t.features.slice(0, 4).map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {plan.financials && (
        <SectionCard icon={LineChart} title="Financials">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="success">Break-even: month {plan.financials.breakEvenMonths}</Badge>
            {plan.financials.revenueProjection.length > 0 && (
              <Badge variant="secondary">
                M{plan.financials.revenueProjection.at(-1)?.month} MRR: $
                {plan.financials.revenueProjection.at(-1)?.mrr.toLocaleString()}
              </Badge>
            )}
          </div>
          <Sparkline values={plan.financials.revenueProjection.map((p) => p.mrr)} />
          <p className="mt-3 text-xs text-muted-foreground">{plan.financials.notes}</p>
        </SectionCard>
      )}

      {plan.roadmap && (
        <SectionCard icon={MapIcon} title="Roadmap">
          <ol className="relative space-y-3 border-l border-border/60 pl-4">
            {plan.roadmap.map((p) => (
              <li key={p.name} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline">{p.durationWeeks}w</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Goals: {p.goals.join(", ")}</p>
                <p className="text-xs text-muted-foreground">Deliverables: {p.deliverables.join(", ")}</p>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      {plan.launchPlan && (
        <SectionCard icon={Megaphone} title="Launch Strategy">
          <p className="mb-3 text-muted-foreground">{plan.launchPlan.gtmStrategy}</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {plan.launchPlan.channels.map((c) => (
              <Badge key={c} variant="outline">{c}</Badge>
            ))}
          </div>
          <div className="space-y-2">
            {plan.launchPlan.timeline.map((t) => (
              <div key={t.week} className="rounded-lg border border-border/60 p-2 text-xs">
                <span className="font-medium">Week {t.week}: </span>
                <span className="text-muted-foreground">{t.activities.join(", ")}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {plan.review && (
        <SectionCard icon={ClipboardCheck} title="Final Review">
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Risks</div>
          <ul className="mb-3 space-y-1">
            {plan.review.risks.map((r) => (
              <li key={r} className="text-amber-400/90">• {r}</li>
            ))}
          </ul>
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Next Steps</div>
          <ul className="space-y-1">
            {plan.review.nextSteps.map((s) => (
              <li key={s} className="text-emerald-400/90">• {s}</li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-16 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-primary/60"
          style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
          title={`Month ${i + 1}: $${v.toLocaleString()}`}
        />
      ))}
    </div>
  );
}
