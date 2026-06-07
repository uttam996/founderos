import type { AgentDeps, AgentNode } from "@/ai/agents/base/types.ts";
import { agentLog, agentThink, agentToolCall } from "@/ai/agents/base/helpers.ts";
import type { GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";
import { MarketingOutputSchema, type MarketingOutput } from "@/ai/schemas.ts";
import { contentGeneratorTool, launchStrategyGeneratorTool, ideaLabel } from "@/ai/tools/index.ts";

/** Marketing: GTM strategy, channels, campaigns, launch timeline. */
export function createMarketingAgent(deps: AgentDeps): AgentNode {
  const { llm } = deps;
  const name = "marketing";

  async function run(state: GraphStateType): Promise<GraphUpdate> {
    const label = ideaLabel(state.idea);
    await agentToolCall(name, "content_generator + launch_strategy_generator");

    const [content, strategy] = await Promise.all([
      contentGeneratorTool.invoke({ idea: state.idea, count: 5 }),
      launchStrategyGeneratorTool.invoke({ idea: state.idea }),
    ]);

    const output = await agentThink<MarketingOutput>(llm, {
      schema: MarketingOutputSchema,
      schemaName: "MarketingOutput",
      temperature: 0.5,
      system:
        "You are the Marketing agent of FounderOS. Build a concrete go-to-market and launch plan with channels, campaigns, content ideas and a week-by-week timeline.",
      prompt: [
        `Idea: ${state.idea}`,
        `Content ideas: ${JSON.stringify(content.ideas)}`,
        `Suggested channels: ${JSON.stringify(strategy.channels)}`,
        `Suggested timeline: ${JSON.stringify(strategy.timeline)}`,
        "Return a launch plan (gtmStrategy, channels, campaigns, contentIdeas, timeline).",
      ].join("\n"),
      mock: () => ({
        launchPlan: {
          gtmStrategy: `Product-led growth for ${label}: free trial + content-driven acquisition, complemented by founder-led outbound to an ICP list.`,
          channels: strategy.channels,
          campaigns: [
            { name: "Waitlist & Beta", goal: "Build a qualified pipeline", tactics: ["Landing page", "Lead magnet", "Community engagement"] },
            { name: "Product Hunt Launch", goal: "Day-one awareness", tactics: ["Hunter outreach", "Founder threads", "Email blast"] },
            { name: "Content Engine", goal: "Compounding SEO + authority", tactics: ["3 posts/week", "Comparison pages", "Customer stories"] },
          ],
          contentIdeas: content.ideas,
          timeline: strategy.timeline,
        },
      }),
    });

    await agentLog(name, "Go-to-market and launch plan complete.");
    return { launchPlan: output.launchPlan };
  }

  return { name, run };
}
