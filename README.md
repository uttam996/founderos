# FounderOS

**An AI-powered multi-agent startup copilot.** You enter a startup idea
(e.g. _"Build a Restaurant SaaS"_) and a team of collaborating AI agents,
orchestrated with **LangGraph**, research the market, scope an MVP, design the
architecture, model the finances, plan the launch, and generate a development
task backlog — producing a complete _startup operating system_.

> Runs **fully offline with zero API keys** thanks to a deterministic mock
> provider. Add a free **Groq** or **Gemini** key (from the in-app **Settings**
> page — no restart needed) for live LLM output.

> **New here?** Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a full
> explanation of what the project does, how it works, and the workflow (with
> diagrams).

---

## Stack

| Layer        | Tech                                                             |
| ------------ | --------------------------------------------------------------- |
| Runtime      | **Bun** (1.1+)                                                  |
| Backend      | **Hono** + TypeScript, feature-modular / clean architecture     |
| Orchestration| **LangGraph** (`@langchain/langgraph`)                          |
| LLM          | **Groq** / **Gemini** (free tiers) with deterministic **mock** fallback; switchable at runtime |
| Memory       | **PostgreSQL** + **pgvector** (optional — JSONB + in-app cosine fallback) |
| Frontend     | **React + Vite + TypeScript + Tailwind + shadcn/ui**            |
| Validation   | **Zod** everywhere (structured outputs, request bodies, env)   |
| Streaming    | **SSE** (live agent activity)                                   |
| Tracing      | **LangSmith** (optional, via env)                              |

---

## The agent team

```
              ┌──────────────┐
  idea  ───▶  │  Supervisor  │  understand goal, set focus areas
              └──────┬───────┘
                     │ fan-out (parallel)
   ┌───────────┬─────┼─────────┬────────────┐
   ▼           ▼     ▼         ▼            ▼
 Research   Product Finance  Engineer   Marketing
 (market,   (MVP,   (pricing,(arch, db, (GTM, launch,
 competitors roadmap)financials)APIs,    content)
 opps)                        tasks)
   └───────────┴─────┬─────────┴────────────┘
                     ▼ join (barrier)
              ┌──────────────┐
              │   Review     │  consolidate + summary + risks
              └──────┬───────┘
                     ▼
            Final Startup Plan + Tasks
```

Each agent depends only on the `LlmProvider` interface (constructor injection),
uses domain **tools**, and returns a Zod-validated structured output that is
merged into the shared LangGraph state.

---

## Quick start

### 1. Install

```bash
bun install
```

### 2. Configure (optional)

```bash
cp .env.example backend/.env
# Optionally add a GROQ_API_KEY (https://console.groq.com/keys)
# or GOOGLE_API_KEY (https://aistudio.google.com/app/apikey).
# Leave both blank to run in deterministic MOCK mode.
```

> You can also configure the provider, model and API key **at runtime** from the
> in-app **Settings** page — no `.env` editing or restart required.
> Bun auto-loads `backend/.env` when running backend commands.

### 3. Start the database (pick one)

**Option A — Docker (recommended):**

```bash
bun run db:up          # starts pgvector/pgvector:pg17 on :5432
```

**Option B — existing local Postgres:** create the role/db:

```sql
CREATE ROLE founderos LOGIN PASSWORD 'founderos';
CREATE DATABASE founderos OWNER founderos;
```

`pgvector` is **optional** — if it isn't installed, the migrate step creates the
memory table as JSONB and recall uses in-app cosine similarity. To enable real
vector search, install pgvector (`CREATE EXTENSION vector;`) and re-run
`db:migrate` (it auto-upgrades the table).

(Adjust `DATABASE_URL` in `backend/.env` to match your setup.)

### 4. Migrate (+ optional seed)

```bash
bun run db:migrate
bun run db:seed        # inserts a few example projects
```

### 5. Run

```bash
bun run dev            # backend on :8787, frontend on :5173
```

Open **http://localhost:5173**, enter an idea, and watch the agents work live.

---

## Project layout

```
GemAi/
├── docker-compose.yml          # Postgres + pgvector
├── .env.example
├── backend/
│   └── src/
│       ├── main.ts             # Bun.serve + Hono
│       ├── app.ts              # app assembly, routes, error handler
│       ├── config/             # env (Zod), container (DI composition root)
│       ├── shared/             # logger, errors, http helpers, db client/migrations
│       ├── ai/                 # the AI engine
│       │   ├── llm/            # provider interface, groq, gemini, mock, mutable, retry
│       │   ├── embeddings/     # provider interface, gemini, mock
│       │   ├── agents/         # supervisor, research, product-manager, finance, engineer, marketing
│       │   ├── graph/          # shared state, workflow, orchestrator, events
│       │   ├── tools/          # research / finance / engineer / marketing tools
│       │   └── schemas.ts      # canonical Zod domain schemas
│       └── modules/            # feature slices (routes + service + repository + schema)
│           ├── projects/  plans/  tasks/  runs/  memory/  settings/
│           └── github/  autonomy/   # GitHub (Phase 2) + autonomy (Phase 3)
└── frontend/
    └── src/
        ├── pages/              # Dashboard, Projects, AgentWorkspace, Tasks, Research, StartupPlans, Settings
        ├── components/         # Layout, PlanCards, AgentActivity, ui/* (shadcn)
        └── lib/                # api client, types, SSE hook
```

---

## API

| Method | Path                          | Description                          |
| ------ | ----------------------------- | ------------------------------------ |
| GET    | `/health`                     | Status, DB, provider info            |
| GET    | `/api/projects`               | List projects                        |
| POST   | `/api/projects`               | Create project `{ idea, name? }`     |
| GET    | `/api/projects/:id`           | Get project                          |
| POST   | `/api/projects/:id/run`       | Start the agent pipeline → `{ runId }` |
| GET    | `/api/runs/:id/stream`        | **SSE** live pipeline events         |
| GET    | `/api/projects/:id/plan`      | Latest consolidated plan             |
| GET    | `/api/projects/:id/tasks`     | Generated dev tasks                  |
| GET    | `/api/projects/:id/research`  | Research subset                      |
| PATCH  | `/api/tasks/:id`              | Update a task                        |
| POST   | `/api/memory/search`          | Semantic recall                      |
| GET    | `/api/settings/llm`           | Current LLM config (no raw key)      |
| PUT    | `/api/settings/llm`           | Update provider / model / key        |
| POST   | `/api/settings/llm/test`      | Test a provider/model/key live       |
| GET    | `/api/settings/github`        | GitHub token status + default repo   |
| PUT    | `/api/settings/github`        | Update GitHub token / default repo   |
| POST   | `/api/settings/github/test`   | Verify GitHub token                  |
| GET    | `/api/github/status`          | GitHub integration status            |
| POST   | `/api/github/issues`          | Create a GitHub issue                |
| POST   | `/api/github/projects/:id/sync` | Sync project tasks → GitHub issues |
| POST   | `/api/github/review`          | Post PR review comment               |
| POST   | `/api/autonomy/build`         | _Phase 3 (scaffold → 501)_           |

SSE event types: `run_start`, `node_start`, `node_complete`, `agent_log`,
`done`, `error`.

---

## How it stays runnable without keys

The `LlmProvider` interface has three implementations selected via a swappable
`MutableLlmProvider` (changeable at runtime from the Settings page):

- **Groq** / **Gemini** — used when a key is configured; structured outputs via
  LangChain, wrapped in exponential-backoff retries. Groq additionally has a
  self-correcting structured-output loop, a concurrency gate, and rate-limit-aware
  retries for free-tier stability.
- **Mock** — deterministic. Every agent call carries a `mock()` factory that
  produces schema-valid, idea-specific content, validated against the **same**
  Zod schema the real model must satisfy. Embeddings are stable hashed vectors so
  similarity search still works.

This means the full LangGraph pipeline, streaming UI, persistence, and memory all
work end-to-end offline, and switching to a live provider changes nothing but the
provider behind the interface.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full workflow,
sequence diagrams, agent table, data model, and provider/settings internals.

---

## Quality

Clean architecture · dependency injection (composition root in
`config/container.ts`) · TypeScript everywhere · Zod at every boundary ·
structured outputs · retry with backoff · centralized typed error handling ·
SSE streaming · optional LangSmith tracing.

---

## Roadmap

- **Phase 1 (done):** multi-agent planning, pgvector memory, full UI, runtime LLM settings.
- **Phase 2 (done):** GitHub integration — create issues, bulk-sync tasks from the Tasks page,
  PR review comments, runtime token/repo in Settings (`modules/github` + Octokit).
- **Phase 3 (next):** autonomous execution — "Build authentication module"
  → plan → code → tests → PR (`modules/autonomy`).

Enable LangSmith tracing:

```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls-...
LANGCHAIN_PROJECT=founderos
```
