import { BaseAgent } from "@/ai/agents/base/agent.ts";
import type { GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";
import {
  SupervisorPlanSchema,
  FinalReviewSchema,
  type SupervisorPlan,
} from "@/ai/schemas.ts";
import { ideaLabel } from "@/ai/tools/index.ts";

/**
 * Supervisor: understands the goal, sets focus areas for the specialists, and
 * later reviews all outputs to produce the final consolidated plan.
 */
export class SupervisorAgent extends BaseAgent {
  readonly name = "supervisor";

  async run(state: GraphStateType): Promise<GraphUpdate> {
    await this.log(`Analyzing the idea: "${state.idea}"`);
    const label = ideaLabel(state.idea);

    const plan = await this.think<SupervisorPlan>({
      schema: SupervisorPlanSchema,
      schemaName: "SupervisorPlan",
      temperature: 0.3,
      system:
        "You are the Supervisor agent of FounderOS, an AI startup copilot. Turn a raw startup idea into a crisp goal, focus areas, and assumptions to guide a team of specialist agents (research, product, finance, engineering, marketing).",
      prompt: `Startup idea: "${state.idea}".\nDefine the refined goal, 4-6 focus areas, and key assumptions.`,
      mock: () => ({
        goal: `Launch a focused MVP of ${label} that wins an underserved segment and reaches early revenue.`,
        focusAreas: [
          "Validate the sharpest customer pain",
          "Differentiate vs incumbents with AI-native UX",
          "Define a lovable, shippable MVP",
          "Design pricing for fast payback",
          "Build a credible go-to-market motion",
        ],
        assumptions: [
          "Buyers are SMB/mid-market teams frustrated with legacy tools",
          "AI-assisted workflows are a meaningful wedge",
          "Self-serve + light sales can drive initial growth",
        ],
      }),
    });

    await this.log(`Goal set. Dispatching specialist agents in parallel.`);
    return { plan };
  }

  /** Join node: consolidates specialist outputs into a final review + summary. */
  async review(state: GraphStateType): Promise<GraphUpdate> {
    await this.log("Reviewing all specialist outputs and resolving conflicts.");
    const label = ideaLabel(state.idea);

    const review = await this.think({
      schema: FinalReviewSchema,
      schemaName: "FinalReview",
      temperature: 0.3,
      system:
        "You are the Supervisor agent producing the final review of a startup plan. Synthesize research, product, finance, engineering and marketing outputs into a concise verdict with risks and next steps.",
      prompt: buildReviewPrompt(state),
      mock: () => ({
        summary: `${label} targets a real, growing market with a clear AI-native wedge. The MVP is scoped, pricing supports fast payback, and the launch plan is executable by a small team.`,
        risks: [
          "Incumbents may copy AI features",
          "Customer acquisition cost could exceed early ARPU",
          "Scope creep in the MVP",
        ],
        nextSteps: [
          "Recruit 10 design partners this month",
          "Ship the must-have MVP features first",
          "Instrument activation and retention from day one",
        ],
      }),
    });

    const summary = await this.llm.generateText({
      temperature: 0.4,
      system: "You are the Supervisor writing a 3-4 sentence executive summary of the startup plan.",
      prompt: `Idea: ${state.idea}\nGoal: ${state.plan?.goal ?? ""}\nReview: ${review.summary}`,
      mock: () =>
        `${label} is a focused bet on an AI-native solution for an underserved segment. Research confirms a sizeable, growing market with beatable incumbents. The plan defines a lean MVP, a payback-friendly pricing model, a pragmatic architecture, and a four-week launch motion. Execute the next steps to validate demand and reach early revenue.`,
    });

    await this.log("Final startup plan assembled.");
    return { review, summary };
  }
}

function buildReviewPrompt(state: GraphStateType): string {
  return [
    `Idea: ${state.idea}`,
    `Goal: ${state.plan?.goal ?? "n/a"}`,
    `Market: ${state.market?.summary ?? "n/a"}`,
    `Positioning: ${state.competitors?.positioning ?? "n/a"}`,
    `MVP features: ${(state.product?.mvpFeatures ?? []).map((f) => f.name).join(", ") || "n/a"}`,
    `Pricing model: ${state.pricing?.model ?? "n/a"}`,
    `Break-even: ${state.financials?.breakEvenMonths ?? "n/a"} months`,
    `Architecture: ${state.architecture?.overview ?? "n/a"}`,
    `GTM: ${state.launchPlan?.gtmStrategy ?? "n/a"}`,
    "",
    "Produce a final review with a summary, top risks, and concrete next steps.",
  ].join("\n");
}
