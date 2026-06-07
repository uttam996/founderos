import { z } from "zod";

/**
 * Canonical domain schemas for agent structured outputs. These are the single
 * source of truth: agents validate against them, the LangGraph state stores
 * them, the DB persists them as JSONB, and the frontend types are derived.
 */

export const SupervisorPlanSchema = z.object({
  goal: z.string().describe("Refined, concrete goal for this startup"),
  focusAreas: z.array(z.string()).min(3).describe("Key areas the agents should focus on"),
  assumptions: z.array(z.string()).describe("Working assumptions about the market/user"),
});
export type SupervisorPlan = z.infer<typeof SupervisorPlanSchema>;

export const MarketAnalysisSchema = z.object({
  summary: z.string(),
  marketSize: z.string().describe("e.g. '$12B TAM, growing 14% YoY'"),
  growthRate: z.string(),
  segments: z.array(z.object({ name: z.string(), description: z.string() })).min(1),
  trends: z.array(z.string()).min(1),
});
export type MarketAnalysis = z.infer<typeof MarketAnalysisSchema>;

export const CompetitorSchema = z.object({
  name: z.string(),
  description: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  pricing: z.string(),
});
export const CompetitorAnalysisSchema = z.object({
  positioning: z.string().describe("How this startup should position vs competitors"),
  competitors: z.array(CompetitorSchema).min(1),
});
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

export const OpportunitiesSchema = z.object({
  opportunities: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string(),
        impact: z.enum(["low", "medium", "high"]),
      }),
    )
    .min(1),
});
export type Opportunities = z.infer<typeof OpportunitiesSchema>;

export const ResearchOutputSchema = z.object({
  market: MarketAnalysisSchema,
  competitors: CompetitorAnalysisSchema,
  opportunities: OpportunitiesSchema,
});
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

export const FeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  priority: z.enum(["must", "should", "could", "wont"]),
  effort: z.enum(["S", "M", "L", "XL"]),
});
export const RoadmapPhaseSchema = z.object({
  name: z.string(),
  durationWeeks: z.number().int().positive(),
  goals: z.array(z.string()).min(1),
  deliverables: z.array(z.string()).min(1),
});
export const ProductOutputSchema = z.object({
  mvpFeatures: z.array(FeatureSchema).min(3),
  roadmap: z.array(RoadmapPhaseSchema).min(1),
  rationale: z.string(),
});
export type ProductOutput = z.infer<typeof ProductOutputSchema>;

export const PricingTierSchema = z.object({
  name: z.string(),
  price: z.string().describe("e.g. '$49/mo'"),
  billing: z.enum(["monthly", "annual", "usage", "one-time"]),
  features: z.array(z.string()).min(1),
});
export const PricingStrategySchema = z.object({
  model: z.string().describe("e.g. 'Tiered SaaS subscription with usage add-ons'"),
  tiers: z.array(PricingTierSchema).min(2),
  rationale: z.string(),
});
export type PricingStrategy = z.infer<typeof PricingStrategySchema>;

export const FinancialsSchema = z.object({
  assumptions: z.array(z.string()).min(1),
  revenueProjection: z
    .array(
      z.object({
        month: z.number().int().positive(),
        customers: z.number().int().nonnegative(),
        mrr: z.number().nonnegative(),
      }),
    )
    .min(1),
  costs: z.array(z.object({ item: z.string(), monthly: z.number().nonnegative() })).min(1),
  breakEvenMonths: z.number().int().positive(),
  notes: z.string(),
});
export type Financials = z.infer<typeof FinancialsSchema>;

export const FinanceOutputSchema = z.object({
  pricing: PricingStrategySchema,
  financials: FinancialsSchema,
});
export type FinanceOutput = z.infer<typeof FinanceOutputSchema>;

export const ApiEndpointSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string(),
  description: z.string(),
});
export const EntitySchema = z.object({
  entity: z.string(),
  fields: z.array(z.string()).min(1),
});
export const ArchitectureSchema = z.object({
  overview: z.string(),
  stack: z.object({
    frontend: z.string(),
    backend: z.string(),
    database: z.string(),
    infra: z.string(),
  }),
  components: z.array(z.object({ name: z.string(), responsibility: z.string() })).min(2),
  dataModel: z.array(EntitySchema).min(1),
  apis: z.array(ApiEndpointSchema).min(1),
});
export type Architecture = z.infer<typeof ArchitectureSchema>;

export const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  module: z.string().describe("e.g. 'Auth System', 'Billing Module'"),
  priority: z.enum(["low", "medium", "high"]),
  estimate: z.string().describe("e.g. '3d', '1w'"),
});
export type GeneratedTask = z.infer<typeof TaskSchema>;

export const EngineerOutputSchema = z.object({
  architecture: ArchitectureSchema,
  tasks: z.array(TaskSchema).min(3),
});
export type EngineerOutput = z.infer<typeof EngineerOutputSchema>;

export const LaunchPlanSchema = z.object({
  gtmStrategy: z.string(),
  channels: z.array(z.string()).min(2),
  campaigns: z
    .array(z.object({ name: z.string(), goal: z.string(), tactics: z.array(z.string()).min(1) }))
    .min(1),
  contentIdeas: z.array(z.string()).min(2),
  timeline: z
    .array(z.object({ week: z.number().int().positive(), activities: z.array(z.string()).min(1) }))
    .min(1),
});
export type LaunchPlan = z.infer<typeof LaunchPlanSchema>;

export const MarketingOutputSchema = z.object({
  launchPlan: LaunchPlanSchema,
});
export type MarketingOutput = z.infer<typeof MarketingOutputSchema>;

export const FinalReviewSchema = z.object({
  summary: z.string(),
  risks: z.array(z.string()).min(1),
  nextSteps: z.array(z.string()).min(1),
});
export type FinalReview = z.infer<typeof FinalReviewSchema>;
