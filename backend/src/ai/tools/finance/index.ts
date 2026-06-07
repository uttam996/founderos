import { z } from "zod";
import { defineTool, seeded } from "@/ai/tools/types.ts";

export const calculatorTool = defineTool({
  name: "calculator",
  description: "Evaluate a basic arithmetic expression (+ - * / parentheses).",
  inputSchema: z.object({ expression: z.string() }),
  outputSchema: z.object({ expression: z.string(), result: z.number() }),
  async invoke({ expression }) {
    if (!/^[\d\s+\-*/().]+$/.test(expression)) {
      throw new Error("Calculator only supports numbers and + - * / ( ).");
    }
    // Safe: input is restricted to arithmetic characters above.
    const result = Function(`"use strict"; return (${expression});`)() as number;
    if (typeof result !== "number" || !Number.isFinite(result)) {
      throw new Error("Expression did not evaluate to a finite number.");
    }
    return { expression, result };
  },
});

export const revenueModelTool = defineTool({
  name: "revenue_model_generator",
  description: "Project monthly customers, MRR and break-even from growth assumptions.",
  inputSchema: z.object({
    idea: z.string(),
    months: z.number().int().positive().default(12),
    startingCustomers: z.number().int().nonnegative().default(10),
    monthlyGrowth: z.number().min(0).max(2).default(0.18),
    arpu: z.number().positive().default(49),
    fixedMonthlyCost: z.number().nonnegative().default(8000),
  }),
  outputSchema: z.object({
    projection: z.array(
      z.object({ month: z.number(), customers: z.number(), mrr: z.number() }),
    ),
    breakEvenMonths: z.number(),
  }),
  async invoke(input) {
    const months = input.months ?? 12;
    const arpu = input.arpu ?? 49;
    const fixedMonthlyCost = input.fixedMonthlyCost ?? 8000;
    const rnd = seeded("rev:" + input.idea);
    const growth = (input.monthlyGrowth ?? 0.18) + rnd() * 0.04;
    const projection: { month: number; customers: number; mrr: number }[] = [];
    let customers = input.startingCustomers ?? 10;
    let breakEven = months;
    let found = false;
    for (let m = 1; m <= months; m++) {
      customers = Math.round(customers * (1 + growth));
      const mrr = Math.round(customers * arpu);
      projection.push({ month: m, customers, mrr });
      if (!found && mrr >= fixedMonthlyCost) {
        breakEven = m;
        found = true;
      }
    }
    return { projection, breakEvenMonths: breakEven };
  },
});

export const financeTools = [calculatorTool, revenueModelTool];
