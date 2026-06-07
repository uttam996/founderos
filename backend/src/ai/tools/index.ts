import { researchTools } from "@/ai/tools/research/index.ts";
import { financeTools } from "@/ai/tools/finance/index.ts";
import { engineerTools } from "@/ai/tools/engineer/index.ts";
import { marketingTools } from "@/ai/tools/marketing/index.ts";

export * from "@/ai/tools/types.ts";
export * from "@/ai/tools/research/index.ts";
export * from "@/ai/tools/finance/index.ts";
export * from "@/ai/tools/engineer/index.ts";
export * from "@/ai/tools/marketing/index.ts";

export const allTools = [...researchTools, ...financeTools, ...engineerTools, ...marketingTools];

export const toolRegistry = Object.fromEntries(allTools.map((t) => [t.name, t]));
