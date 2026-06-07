import { BaseAgent } from "@/ai/agents/base/agent.ts";
import type { GraphStateType, GraphUpdate } from "@/ai/graph/state.ts";
import { EngineerOutputSchema, type EngineerOutput } from "@/ai/schemas.ts";
import {
  architectureGeneratorTool,
  dbSchemaGeneratorTool,
  apiSpecGeneratorTool,
  ideaLabel,
} from "@/ai/tools/index.ts";

/**
 * Engineer agent: technical architecture, data model, API design, and automatic
 * generation of development tasks (which are persisted to the tasks table).
 */
export class EngineerAgent extends BaseAgent {
  readonly name = "engineer";

  async run(state: GraphStateType): Promise<GraphUpdate> {
    const label = ideaLabel(state.idea);
    await this.toolCall("architecture_generator + database_schema_generator + api_specification_generator");

    const [arch, db, apis] = await Promise.all([
      architectureGeneratorTool.invoke({ idea: state.idea }),
      dbSchemaGeneratorTool.invoke({ idea: state.idea }),
      apiSpecGeneratorTool.invoke({ idea: state.idea }),
    ]);

    const output = await this.think<EngineerOutput>({
      schema: EngineerOutputSchema,
      schemaName: "EngineerOutput",
      temperature: 0.3,
      system:
        "You are the Engineer agent of FounderOS. Design a pragmatic architecture and break the build into concrete, well-scoped development tasks grouped by module.",
      prompt: [
        `Idea: ${state.idea}`,
        `Suggested stack: ${JSON.stringify(arch.stack)}`,
        `Suggested components: ${JSON.stringify(arch.components)}`,
        `Suggested data model: ${JSON.stringify(db.entities)}`,
        `Suggested APIs: ${JSON.stringify(apis.apis)}`,
        "Return the architecture and a backlog of development tasks (module-grouped).",
      ].join("\n"),
      mock: () => ({
        architecture: {
          overview: `A modular, production-ready SaaS architecture for ${label} with a clear separation between API, domain services, async workers and an AI service.`,
          stack: arch.stack,
          components: arch.components,
          dataModel: db.entities,
          apis: apis.apis,
        },
        tasks: [
          { title: "Build Auth System", description: "Email/password + OAuth, sessions, RBAC.", module: "Auth System", priority: "high" as const, estimate: "1w" },
          { title: "Core domain module", description: `Primary CRUD + business logic for ${label}.`, module: "Core Module", priority: "high" as const, estimate: "2w" },
          { title: "AI Assistant service", description: "LLM orchestration for in-app automation.", module: "AI Module", priority: "high" as const, estimate: "1w" },
          { title: "Billing Module", description: "Stripe subscriptions, plans, webhooks.", module: "Billing Module", priority: "medium" as const, estimate: "1w" },
          { title: "Analytics Module", description: "Event tracking + usage dashboard.", module: "Analytics Module", priority: "medium" as const, estimate: "4d" },
          { title: "Integrations Module", description: "Connectors to common third-party tools.", module: "Integrations Module", priority: "low" as const, estimate: "1w" },
        ],
      }),
    });

    await this.log(`Architecture designed; generated ${output.tasks.length} development tasks.`);
    return { architecture: output.architecture, tasks: output.tasks };
  }
}
