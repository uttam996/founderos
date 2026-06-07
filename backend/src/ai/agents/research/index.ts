import { BaseAgent } from "@/ai/agents/base/agent.ts";
import type { GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";
import { ResearchOutputSchema, type ResearchOutput } from "@/ai/schemas.ts";
import { marketSearchTool, competitorSearchTool, webSearchTool, ideaLabel } from "@/ai/tools/index.ts";

/**
 * Research agent: market sizing, competitor analysis, opportunity discovery.
 * Uses the research tools to gather context (real or synthesized) before
 * producing a validated structured output.
 */
export class ResearchAgent extends BaseAgent {
  readonly name = "research";

  async run(state: GraphStateType): Promise<GraphUpdate> {
    const label = ideaLabel(state.idea);
    await this.toolCall("web_search + market_search + competitor_search");

    const [web, market, competitors] = await Promise.all([
      webSearchTool.invoke({ query: state.idea }),
      marketSearchTool.invoke({ query: state.idea }),
      competitorSearchTool.invoke({ query: state.idea }),
    ]);

    await this.log(`Found ${competitors.competitors.length} competitors; estimating opportunities.`);

    const output = await this.think<ResearchOutput>({
      schema: ResearchOutputSchema,
      schemaName: "ResearchOutput",
      temperature: 0.4,
      system:
        "You are the Research agent of FounderOS. Produce rigorous market analysis, competitor analysis and opportunity discovery. Ground your answer in the provided tool findings.",
      prompt: [
        `Idea: ${state.idea}`,
        `Web findings: ${JSON.stringify(web.results)}`,
        `Market findings: ${JSON.stringify(market)}`,
        `Competitor findings: ${JSON.stringify(competitors.competitors)}`,
        "Return market analysis, competitor analysis (with positioning) and ranked opportunities.",
      ].join("\n"),
      mock: () => ({
        market: {
          summary: `${label} serves teams that have outgrown spreadsheets and legacy tools. Demand is driven by automation and AI-native workflows.`,
          marketSize: market.marketSize,
          growthRate: market.growthRate,
          segments: market.segments.map((s) => ({ name: s, description: `${s} buyers needing ${label}.` })),
          trends: market.trends,
        },
        competitors: {
          positioning: `Position ${label} as the AI-native, faster-to-value alternative to legacy incumbents, starting with an underserved segment.`,
          competitors: competitors.competitors,
        },
        opportunities: {
          opportunities: [
            { title: "AI-native workflow automation", rationale: "Incumbents bolt AI on; a native experience wins.", impact: "high" as const },
            { title: "Underserved SMB segment", rationale: "Enterprise tools are too heavy and pricey.", impact: "high" as const },
            { title: "Faster time-to-value onboarding", rationale: "Reduce setup from weeks to minutes.", impact: "medium" as const },
          ],
        },
      }),
    });

    await this.log("Market, competitor and opportunity analysis complete.");
    return {
      market: output.market,
      competitors: output.competitors,
      opportunities: output.opportunities,
    };
  }
}
