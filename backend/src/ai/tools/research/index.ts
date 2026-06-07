import { z } from "zod";
import { defineTool, ideaLabel, seeded } from "@/ai/tools/types.ts";

const SearchInput = z.object({ query: z.string() });

export const webSearchTool = defineTool({
  name: "web_search",
  description: "Search the web for general information about a topic or market.",
  inputSchema: SearchInput,
  outputSchema: z.object({
    query: z.string(),
    results: z.array(z.object({ title: z.string(), snippet: z.string(), url: z.string() })),
  }),
  async invoke({ query }) {
    const label = ideaLabel(query);
    const rnd = seeded(query);
    const angles = ["market overview", "industry trends", "buyer pain points", "regulation", "tech adoption"];
    return {
      query,
      results: angles.slice(0, 3 + Math.floor(rnd() * 2)).map((angle, i) => ({
        title: `${label}: ${angle}`,
        snippet: `Analysis of ${label} focusing on ${angle}. Demand is rising as teams seek automation and better workflows in this space.`,
        url: `https://research.example.com/${encodeURIComponent(label.toLowerCase())}/${i}`,
      })),
    };
  },
});

export const marketSearchTool = defineTool({
  name: "market_search",
  description: "Estimate market size, growth, segments and trends for an idea.",
  inputSchema: SearchInput,
  outputSchema: z.object({
    marketSize: z.string(),
    growthRate: z.string(),
    segments: z.array(z.string()),
    trends: z.array(z.string()),
  }),
  async invoke({ query }) {
    const label = ideaLabel(query);
    const rnd = seeded("market:" + query);
    const tam = 4 + Math.floor(rnd() * 40);
    const growth = 8 + Math.floor(rnd() * 22);
    return {
      marketSize: `~$${tam}B global TAM for ${label}`,
      growthRate: `${growth}% CAGR over the next 5 years`,
      segments: ["SMB", "Mid-market", "Enterprise", "Prosumer"].slice(0, 2 + Math.floor(rnd() * 2)),
      trends: [
        `AI-assisted workflows in ${label}`,
        "Shift to usage-based pricing",
        "Mobile-first operations",
        "Vertical SaaS consolidation",
      ].slice(0, 3),
    };
  },
});

export const competitorSearchTool = defineTool({
  name: "competitor_search",
  description: "Find likely competitors with strengths, weaknesses and pricing.",
  inputSchema: SearchInput,
  outputSchema: z.object({
    competitors: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        pricing: z.string(),
      }),
    ),
  }),
  async invoke({ query }) {
    const label = ideaLabel(query);
    const rnd = seeded("comp:" + query);
    const base = ["Acme", "NorthStar", "Quanta", "Hivebrook", "Cloudbench"];
    const count = 3 + Math.floor(rnd() * 2);
    return {
      competitors: base.slice(0, count).map((n, i) => ({
        name: `${n} ${i === 0 ? "Cloud" : "Pro"}`,
        description: `Established ${label} solution targeting ${i % 2 === 0 ? "mid-market" : "SMB"} customers.`,
        strengths: ["Brand recognition", "Broad integrations", i % 2 ? "Strong onboarding" : "Mature analytics"],
        weaknesses: ["Legacy UX", "Slow to ship AI features", i % 2 ? "Pricey" : "Limited automation"],
        pricing: `$${29 + i * 20}-$${99 + i * 50}/mo`,
      })),
    };
  },
});

export const researchTools = [webSearchTool, marketSearchTool, competitorSearchTool];
