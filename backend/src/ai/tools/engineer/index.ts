import { z } from "zod";
import { defineTool, ideaLabel } from "@/ai/tools/types.ts";

export const architectureGeneratorTool = defineTool({
  name: "architecture_generator",
  description: "Propose a pragmatic, production-ready architecture and stack.",
  inputSchema: z.object({ idea: z.string() }),
  outputSchema: z.object({
    stack: z.object({ frontend: z.string(), backend: z.string(), database: z.string(), infra: z.string() }),
    components: z.array(z.object({ name: z.string(), responsibility: z.string() })),
  }),
  async invoke({ idea }) {
    const label = ideaLabel(idea);
    return {
      stack: {
        frontend: "React + TypeScript + Tailwind + shadcn/ui",
        backend: "Bun + Hono (TypeScript), REST + SSE",
        database: "PostgreSQL + pgvector",
        infra: "Docker, deployed on Fly.io/Render; object storage on S3",
      },
      components: [
        { name: "API Gateway", responsibility: `Auth, routing, rate limiting for ${label}` },
        { name: "Core Service", responsibility: "Domain logic, persistence, business rules" },
        { name: "Worker", responsibility: "Async jobs, notifications, scheduled tasks" },
        { name: "AI Service", responsibility: "LLM orchestration and embeddings" },
      ],
    };
  },
});

export const dbSchemaGeneratorTool = defineTool({
  name: "database_schema_generator",
  description: "Generate a relational data model (entities + fields) for the idea.",
  inputSchema: z.object({ idea: z.string() }),
  outputSchema: z.object({
    entities: z.array(z.object({ entity: z.string(), fields: z.array(z.string()) })),
  }),
  async invoke({ idea }) {
    const label = ideaLabel(idea);
    return {
      entities: [
        { entity: "users", fields: ["id", "email", "name", "role", "created_at"] },
        { entity: "organizations", fields: ["id", "name", "plan", "created_at"] },
        {
          entity: label.toLowerCase().replace(/\s+/g, "_").slice(0, 20) || "records",
          fields: ["id", "org_id", "name", "status", "metadata", "created_at"],
        },
        { entity: "subscriptions", fields: ["id", "org_id", "tier", "status", "renews_at"] },
        { entity: "audit_logs", fields: ["id", "actor_id", "action", "target", "created_at"] },
      ],
    };
  },
});

export const apiSpecGeneratorTool = defineTool({
  name: "api_specification_generator",
  description: "Generate a REST API surface (method, path, description).",
  inputSchema: z.object({ idea: z.string() }),
  outputSchema: z.object({
    apis: z.array(
      z.object({
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
        path: z.string(),
        description: z.string(),
      }),
    ),
  }),
  async invoke() {
    return {
      apis: [
        { method: "POST" as const, path: "/api/auth/login", description: "Authenticate a user" },
        { method: "GET" as const, path: "/api/me", description: "Current user profile" },
        { method: "GET" as const, path: "/api/resources", description: "List domain resources" },
        { method: "POST" as const, path: "/api/resources", description: "Create a resource" },
        { method: "PATCH" as const, path: "/api/resources/:id", description: "Update a resource" },
        { method: "GET" as const, path: "/api/billing/subscription", description: "Subscription status" },
      ],
    };
  },
});

export const engineerTools = [architectureGeneratorTool, dbSchemaGeneratorTool, apiSpecGeneratorTool];
