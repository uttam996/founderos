import type { AgentDeps, AgentNode } from "@/ai/agents/base/types.ts";
import { agentLog, agentThink } from "@/ai/agents/base/helpers.ts";
import type { GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";
import { ProductOutputSchema, type ProductOutput } from "@/ai/schemas.ts";
import { ideaLabel } from "@/ai/tools/index.ts";

/** Product Manager: MVP scoping, MoSCoW prioritization, phased roadmap. */
export function createProductManagerAgent(deps: AgentDeps): AgentNode {
  const { llm } = deps;
  const name = "product-manager";

  async function run(state: GraphStateType): Promise<GraphUpdate> {
    const label = ideaLabel(state.idea);
    await agentLog(name, "Scoping the MVP and prioritizing features.");

    const product = await agentThink<ProductOutput>(llm, {
      schema: ProductOutputSchema,
      schemaName: "ProductOutput",
      temperature: 0.4,
      system:
        "You are the Product Manager agent of FounderOS. Define a lean MVP with MoSCoW-prioritized features and a phased delivery roadmap.",
      prompt: [
        `Idea: ${state.idea}`,
        `Goal: ${state.plan?.goal ?? ""}`,
        `Focus areas: ${(state.plan?.focusAreas ?? []).join("; ")}`,
        "Return MVP features (with priority + effort) and a 3-phase roadmap.",
      ].join("\n"),
      mock: () => ({
        mvpFeatures: [
          { name: "Authentication & Onboarding", description: `Sign up, login, and quick setup for ${label}.`, priority: "must" as const, effort: "M" as const },
          { name: "Core Workspace", description: "Primary screen where users do the main job-to-be-done.", priority: "must" as const, effort: "L" as const },
          { name: "AI Assistant", description: "AI-native automation that differentiates from incumbents.", priority: "must" as const, effort: "L" as const },
          { name: "Billing & Plans", description: "Subscription management with tiers.", priority: "should" as const, effort: "M" as const },
          { name: "Analytics Dashboard", description: "Usage and outcome metrics for users.", priority: "should" as const, effort: "M" as const },
          { name: "Integrations", description: "Connect to the tools customers already use.", priority: "could" as const, effort: "L" as const },
        ],
        roadmap: [
          { name: "Phase 1 - Foundation", durationWeeks: 4, goals: ["Auth", "Core workspace"], deliverables: ["Login", "Primary CRUD flows"] },
          { name: "Phase 2 - Differentiation", durationWeeks: 4, goals: ["AI assistant", "Analytics"], deliverables: ["AI automation", "Dashboard"] },
          { name: "Phase 3 - Monetization", durationWeeks: 3, goals: ["Billing", "Integrations"], deliverables: ["Stripe plans", "2 key integrations"] },
        ],
        rationale: `Prioritize the smallest set of features that proves ${label} delivers value, then layer differentiation and monetization.`,
      }),
    });

    await agentLog(name, `Defined ${product.mvpFeatures.length} MVP features across ${product.roadmap.length} phases.`);
    return { product };
  }

  return { name, run };
}
