export type ProjectStatus = "draft" | "running" | "ready" | "error";

export interface Project {
  id: string;
  name: string;
  idea: string;
  status: ProjectStatus;
  githubRepo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketAnalysis {
  summary: string;
  marketSize: string;
  growthRate: string;
  segments: { name: string; description: string }[];
  trends: string[];
}

export interface Competitor {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  pricing: string;
}
export interface CompetitorAnalysis {
  positioning: string;
  competitors: Competitor[];
}

export interface Opportunities {
  opportunities: { title: string; rationale: string; impact: "low" | "medium" | "high" }[];
}

export interface Feature {
  name: string;
  description: string;
  priority: "must" | "should" | "could" | "wont";
  effort: "S" | "M" | "L" | "XL";
}
export interface RoadmapPhase {
  name: string;
  durationWeeks: number;
  goals: string[];
  deliverables: string[];
}

export interface PricingTier {
  name: string;
  price: string;
  billing: "monthly" | "annual" | "usage" | "one-time";
  features: string[];
}
export interface PricingStrategy {
  model: string;
  tiers: PricingTier[];
  rationale: string;
}

export interface Financials {
  assumptions: string[];
  revenueProjection: { month: number; customers: number; mrr: number }[];
  costs: { item: string; monthly: number }[];
  breakEvenMonths: number;
  notes: string;
}

export interface Architecture {
  overview: string;
  stack: { frontend: string; backend: string; database: string; infra: string };
  components: { name: string; responsibility: string }[];
  dataModel: { entity: string; fields: string[] }[];
  apis: { method: string; path: string; description: string }[];
}

export interface LaunchPlan {
  gtmStrategy: string;
  channels: string[];
  campaigns: { name: string; goal: string; tactics: string[] }[];
  contentIdeas: string[];
  timeline: { week: number; activities: string[] }[];
}

export interface FinalReview {
  summary: string;
  risks: string[];
  nextSteps: string[];
}

export interface StartupPlan {
  id: string;
  projectId: string;
  runId: string | null;
  market: MarketAnalysis | null;
  competitors: CompetitorAnalysis | null;
  opportunities: Opportunities | null;
  mvpFeatures: Feature[] | null;
  roadmap: RoadmapPhase[] | null;
  pricing: PricingStrategy | null;
  financials: Financials | null;
  architecture: Architecture | null;
  launchPlan: LaunchPlan | null;
  review: FinalReview | null;
  summary: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  module: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  estimate: string;
  position: number;
  githubIssueNumber: number | null;
  githubIssueUrl: string | null;
  createdAt: string;
}

export interface MemoryHit {
  id: string;
  projectId: string | null;
  kind: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
  createdAt: string;
}

export type PipelineEvent =
  | { type: "run_start"; idea: string; at: string }
  | { type: "node_start"; node: string; label: string; at: string }
  | { type: "node_complete"; node: string; label: string; at: string }
  | { type: "agent_log"; agent: string; message: string; kind: string; at: string }
  | { type: "done"; at: string }
  | { type: "error"; message: string; at: string };

export interface Health {
  status: string;
  db: boolean;
  llm: { provider: string; model: string };
  embeddings: { provider: string; dim: number };
  time: string;
}

export type LlmProviderName = "groq" | "gemini" | "mock";

export interface LlmSettings {
  provider: LlmProviderName;
  model: string;
  baseUrl: string;
  hasApiKey: boolean;
}

export interface LlmSettingsResponse {
  config: LlmSettings;
  effective: { provider: string; model: string };
}

export interface UpdateLlmSettings {
  provider: LlmProviderName;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface LlmTestResult {
  ok: boolean;
  provider: string;
  model: string;
  message: string;
}

export interface GitHubSettings {
  hasToken: boolean;
  defaultRepo: string;
}

export interface GitHubSyncResult {
  repo: string;
  created: number;
  skipped: number;
  issues: { taskId: string; url: string; number: number }[];
}
