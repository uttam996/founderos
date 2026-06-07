import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Database, Cpu, Github, Bot, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { LlmProviderName, UpdateLlmSettings } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PROVIDERS: { value: LlmProviderName; label: string; hint: string }[] = [
  { value: "groq", label: "Groq (free, OpenAI-compatible)", hint: "e.g. llama-3.3-70b-versatile" },
  { value: "gemini", label: "Google Gemini (free tier)", hint: "e.g. gemini-1.5-flash" },
  { value: "mock", label: "Mock (offline, deterministic)", hint: "no key required" },
];

const DEFAULT_MODEL: Record<LlmProviderName, string> = {
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-1.5-flash",
  mock: "mock-deterministic",
};

export function Settings() {
  const qc = useQueryClient();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const settings = useQuery({ queryKey: ["settings"], queryFn: api.getSettings });
  const githubSettings = useQuery({ queryKey: ["settings-github"], queryFn: api.getGitHubSettings });

  const [provider, setProvider] = useState<LlmProviderName>("groq");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);

  const [ghToken, setGhToken] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [hasStoredGhToken, setHasStoredGhToken] = useState(false);

  useEffect(() => {
    const cfg = settings.data?.config;
    if (cfg) {
      setProvider(cfg.provider);
      setModel(cfg.model);
      setBaseUrl(cfg.baseUrl);
      setHasStoredKey(cfg.hasApiKey);
      setApiKey("");
    }
  }, [settings.data]);

  useEffect(() => {
    const gh = githubSettings.data;
    if (gh) {
      setGhRepo(gh.defaultRepo);
      setHasStoredGhToken(gh.hasToken);
      setGhToken("");
    }
  }, [githubSettings.data]);

  const payload = (): UpdateLlmSettings => ({
    provider,
    model: model.trim() || undefined,
    baseUrl: provider === "groq" ? baseUrl.trim() || undefined : undefined,
    apiKey: apiKey.trim() || undefined,
  });

  const save = useMutation({
    mutationFn: () => api.updateSettings(payload()),
    onSuccess: () => {
      setApiKey("");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["health"] });
    },
  });

  const test = useMutation({ mutationFn: () => api.testSettings(payload()) });

  const saveGitHub = useMutation({
    mutationFn: () =>
      api.updateGitHubSettings({
        token: ghToken.trim() || undefined,
        defaultRepo: ghRepo.trim(),
      }),
    onSuccess: () => {
      setGhToken("");
      qc.invalidateQueries({ queryKey: ["settings-github"] });
    },
  });

  const testGitHub = useMutation({ mutationFn: () => api.testGitHubSettings() });

  const onProviderChange = (p: LlmProviderName) => {
    setProvider(p);
    setModel(DEFAULT_MODEL[p]);
    test.reset();
  };

  const effective = settings.data?.effective ?? health.data?.llm;
  const needsKey = provider !== "mock" && !hasStoredKey && !apiKey.trim();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure the AI model, long-term memory and integrations." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-primary" /> AI Model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <span className="text-muted-foreground">Currently active:</span>
              <Badge variant="outline">{effective?.provider ?? "..."}</Badge>
              <span className="font-medium">{effective?.model ?? "..."}</span>
              {effective && settings.data && effective.provider !== settings.data.config.provider && (
                <span className="text-xs text-amber-300">
                  (falling back — add an API key for {settings.data.config.provider})
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Provider">
                <select
                  value={provider}
                  onChange={(e) => onProviderChange(e.target.value as LlmProviderName)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Model">
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={DEFAULT_MODEL[provider]}
                  disabled={provider === "mock"}
                />
              </Field>

              {provider === "groq" && (
                <Field label="Base URL">
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.groq.com/openai/v1"
                  />
                </Field>
              )}

              {provider !== "mock" && (
                <Field label="API key">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={hasStoredKey ? "•••••••• stored — leave blank to keep" : "Paste your API key"}
                  />
                </Field>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {PROVIDERS.find((p) => p.value === provider)?.hint}
              {provider === "groq" && " — get a free key at console.groq.com/keys"}
              {provider === "gemini" && " — get a free key at aistudio.google.com"}
            </p>

            <div className="flex items-center gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending}>
                {test.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test connection
              </Button>
              {save.isSuccess && !save.isPending && (
                <span className="text-xs text-emerald-400">Saved.</span>
              )}
              {needsKey && (
                <span className="text-xs text-amber-300">Add an API key, or it will run in mock mode.</span>
              )}
            </div>

            {save.isError && (
              <p className="text-sm text-destructive">{(save.error as Error).message}</p>
            )}

            {test.data && (
              <div
                className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                  test.data.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-destructive/10 text-destructive"
                }`}
              >
                {test.data.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>
                  <strong>{test.data.provider}</strong> / {test.data.model}: {test.data.message}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Github className="h-4 w-4 text-primary" /> GitHub Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">
              Sync Engineer-generated tasks to GitHub Issues. Create a token at{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                github.com/settings/tokens
              </a>{" "}
              with <code className="text-xs">repo</code> scope.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Personal access token">
                <Input
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  placeholder={
                    hasStoredGhToken ? "•••••••• stored — leave blank to keep" : "ghp_..."
                  }
                />
              </Field>
              <Field label="Default repo (owner/repo)">
                <Input
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                  placeholder="your-org/your-repo"
                />
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveGitHub.mutate()} disabled={saveGitHub.isPending}>
                {saveGitHub.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => testGitHub.mutate()}
                disabled={testGitHub.isPending || (!hasStoredGhToken && !ghToken.trim())}
              >
                {testGitHub.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test connection
              </Button>
              {saveGitHub.isSuccess && !saveGitHub.isPending && (
                <span className="text-xs text-emerald-400">Saved.</span>
              )}
            </div>

            {testGitHub.data && (
              <div
                className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                  testGitHub.data.ok
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {testGitHub.data.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{testGitHub.data.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" /> System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label="Database"
              value={health.data ? (health.data.db ? "Connected" : "Offline") : "..."}
            />
            <Row label="Embeddings" value={health.data?.embeddings.provider ?? "..."} />
            <Row label="Embedding dim" value={String(health.data?.embeddings.dim ?? "...")} />
            <Row
              label="GitHub"
              value={githubSettings.data?.hasToken ? "Connected" : "Not configured"}
            />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Autonomous execution</span>
              <Badge variant="secondary"><Bot className="mr-1 h-3 w-3" /> Phase 3</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" /> Long-term Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MemorySearch />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemorySearch() {
  const [query, setQuery] = useState("");
  const search = useMutation({ mutationFn: () => api.searchMemory({ query, limit: 8 }) });
  return (
    <>
      <div className="flex gap-2">
        <Input
          placeholder="Semantic search across previous discussions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query && search.mutate()}
        />
        <Button onClick={() => search.mutate()} disabled={!query || search.isPending}>
          Search
        </Button>
      </div>
      {search.isError && (
        <p className="mt-3 text-sm text-destructive">{(search.error as Error).message}</p>
      )}
      <div className="mt-4 space-y-2">
        {(search.data ?? []).map((hit) => (
          <div key={hit.id} className="rounded-lg border border-border/60 p-3 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <Badge variant="outline">{hit.kind}</Badge>
              <span className="text-xs text-muted-foreground">similarity {hit.similarity.toFixed(3)}</span>
            </div>
            <p className="whitespace-pre-wrap text-xs text-muted-foreground">{hit.content}</p>
          </div>
        ))}
        {search.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No memories found yet.</p>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
