import type {
  MarketAnalysis,
  CompetitorAnalysis,
  Opportunities,
  ProductOutput,
  PricingStrategy,
  Financials,
  Architecture,
  LaunchPlan,
  FinalReview,
} from "@/ai/schemas.ts";

/** Persisted, consolidated startup plan returned to the frontend. */
export interface StartupPlan {
  id: string;
  projectId: string;
  runId: string | null;
  market: MarketAnalysis | null;
  competitors: CompetitorAnalysis | null;
  opportunities: Opportunities | null;
  mvpFeatures: ProductOutput["mvpFeatures"] | null;
  roadmap: ProductOutput["roadmap"] | null;
  productRationale: string | null;
  pricing: PricingStrategy | null;
  financials: Financials | null;
  architecture: Architecture | null;
  launchPlan: LaunchPlan | null;
  review: FinalReview | null;
  summary: string | null;
  createdAt: string;
}

export interface SaveStartupPlanInput {
  projectId: string;
  runId: string | null;
  market: MarketAnalysis | null;
  competitors: CompetitorAnalysis | null;
  opportunities: Opportunities | null;
  product: ProductOutput | null;
  pricing: PricingStrategy | null;
  financials: Financials | null;
  architecture: Architecture | null;
  launchPlan: LaunchPlan | null;
  review: FinalReview | null;
  summary: string;
}
