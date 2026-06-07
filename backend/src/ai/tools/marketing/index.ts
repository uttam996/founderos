import { z } from "zod";
import { defineTool, ideaLabel } from "@/ai/tools/types.ts";

export const contentGeneratorTool = defineTool({
  name: "content_generator",
  description: "Generate launch content ideas (posts, headlines, hooks).",
  inputSchema: z.object({ idea: z.string(), count: z.number().int().positive().default(5) }),
  outputSchema: z.object({ ideas: z.array(z.string()) }),
  async invoke({ idea, count }) {
    const label = ideaLabel(idea);
    const ideas = [
      `Launch thread: "We built ${label} so teams stop drowning in spreadsheets."`,
      `Demo video: 60-second walkthrough of ${label}`,
      `Comparison post: ${label} vs the legacy way`,
      `Customer story: how an early user saved 10 hrs/week with ${label}`,
      `Founder POV: the problem in ${label} nobody talks about`,
      `Changelog: shipping ${label} v1 in public`,
    ];
    return { ideas: ideas.slice(0, count) };
  },
});

export const launchStrategyGeneratorTool = defineTool({
  name: "launch_strategy_generator",
  description: "Generate a go-to-market launch plan with channels and a timeline.",
  inputSchema: z.object({ idea: z.string() }),
  outputSchema: z.object({
    channels: z.array(z.string()),
    timeline: z.array(z.object({ week: z.number(), activities: z.array(z.string()) })),
  }),
  async invoke({ idea }) {
    const label = ideaLabel(idea);
    return {
      channels: ["Product Hunt", "LinkedIn", "X/Twitter", "Founder communities", "SEO content", "Cold outbound"],
      timeline: [
        { week: 1, activities: [`Build waitlist landing page for ${label}`, "Collect 100 emails"] },
        { week: 2, activities: ["Publish 3 SEO posts", "Engage in 5 relevant communities"] },
        { week: 3, activities: ["Recruit 10 design partners", "Open private beta"] },
        { week: 4, activities: ["Product Hunt launch", "Founder launch threads", "Outbound to ICP list"] },
      ],
    };
  },
});

export const marketingTools = [contentGeneratorTool, launchStrategyGeneratorTool];
