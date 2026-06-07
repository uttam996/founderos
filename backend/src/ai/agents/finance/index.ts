import type { AgentDeps, AgentNode } from "@/ai/agents/base/types.ts";
import { agentLog, agentThink, agentToolCall } from "@/ai/agents/base/helpers.ts";
import type { GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";
import { FinanceOutputSchema, type FinanceOutput } from "@/ai/schemas.ts";
import { revenueModelTool, ideaLabel } from "@/ai/tools/index.ts";

/** Finance: pricing strategy, revenue projections, break-even. */
export function createFinanceAgent(deps: AgentDeps): AgentNode {
  const { llm } = deps;
  const name = "finance";

  async function run(state: GraphStateType): Promise<GraphUpdate> {
    const label = ideaLabel(state.idea);
    await agentToolCall(name, "revenue_model_generator");

    const model = await revenueModelTool.invoke({
      idea: state.idea,
      months: 12,
      startingCustomers: 15,
      monthlyGrowth: 0.18,
      arpu: 49,
      fixedMonthlyCost: 9000,
    });

    await agentLog(name, `Projected break-even at month ${model.breakEvenMonths}.`);

    const output = await agentThink<FinanceOutput>(llm, {
      schema: FinanceOutputSchema,
      schemaName: "FinanceOutput",
      temperature: 0.3,
      system:
        "You are the Finance agent of FounderOS. Design a pricing strategy and a realistic 12-month financial model grounded in the provided projection.",
      prompt: [
        `Idea: ${state.idea}`,
        `Revenue projection: ${JSON.stringify(model.projection)}`,
        `Break-even months: ${model.breakEvenMonths}`,
        "Return a tiered pricing strategy and financials (assumptions, projection, costs, break-even, notes).",
      ].join("\n"),
      mock: () => ({
        pricing: {
          model: "Tiered SaaS subscription with a usage-based add-on",
          tiers: [
            { name: "Starter", price: "$29/mo", billing: "monthly" as const, features: ["Core workspace", "1 seat", "Email support"] },
            { name: "Pro", price: "$79/mo", billing: "monthly" as const, features: ["Everything in Starter", "AI assistant", "5 seats", "Analytics"] },
            { name: "Business", price: "$199/mo", billing: "monthly" as const, features: ["Everything in Pro", "Unlimited seats", "Integrations", "Priority support"] },
          ],
          rationale: `Anchor on Pro for ${label}; Starter drives self-serve adoption and Business captures larger teams.`,
        },
        financials: {
          assumptions: ["ARPU ~$49", "18% MoM growth", "Self-serve dominates early", "Fixed cost ~$9k/mo"],
          revenueProjection: model.projection,
          costs: [
            { item: "Infrastructure", monthly: 1200 },
            { item: "Founding team", monthly: 6000 },
            { item: "Tools & SaaS", monthly: 800 },
            { item: "Marketing", monthly: 1000 },
          ],
          breakEvenMonths: model.breakEvenMonths,
          notes: "Watch CAC vs ARPU; keep payback under 12 months. Annual plans improve cash flow.",
        },
      }),
    });

    await agentLog(name, "Pricing strategy and financial model complete.");
    return { pricing: output.pricing, financials: output.financials };
  }

  return { name, run };
}
