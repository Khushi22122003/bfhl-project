import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// Preview uses /api/bfhl (ingress routes /api/* to backend).
// For the deployed Node.js backend, use the raw /bfhl endpoint.
const API_PATH = "/api/bfhl";

const DEFAULT_SAMPLE = `A->B
A->C
B->D
C->E
E->F
X->Y
Y->Z
Z->X
P->Q
Q->R
G->H
G->H
G->I
hello
1->2
A->`;

function TreeNode({ name, kids, level = 0 }) {
  const entries = Object.entries(kids || {});
  return (
    <div
      data-testid={`tree-node-${name}`}
      style={{ paddingLeft: level === 0 ? 0 : 16 }}
      className="relative"
    >
      <div className="flex items-center gap-2 py-1">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--accent)] text-[color:var(--accent-fg)] font-mono text-sm font-bold shadow-sm">
          {name}
        </span>
        {entries.length > 0 && (
          <span className="text-xs text-[color:var(--muted-fg)] font-mono">
            {entries.length} child{entries.length > 1 ? "ren" : ""}
          </span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="ml-3 border-l border-dashed border-[color:var(--border)] pl-3">
          {entries.map(([k, v]) => (
            <TreeNode key={k} name={k} kids={v} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function HierarchyCard({ h, isLargest }) {
  const rootEntry = h.tree && typeof h.tree === "object" ? Object.entries(h.tree)[0] : null;
  return (
    <div
      data-testid={`hierarchy-card-${h.root}`}
      className={`rounded-xl border p-5 bg-[color:var(--surface)] transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        h.has_cycle
          ? "border-[color:var(--danger)]/40"
          : isLargest
          ? "border-[color:var(--accent)]"
          : "border-[color:var(--border)]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-fg)]">
            root
          </span>
          <span className="font-mono text-lg font-bold text-[color:var(--fg)]">
            {h.root}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {h.has_cycle && (
            <span className="rounded-full bg-[color:var(--danger)]/10 text-[color:var(--danger)] px-2.5 py-0.5 text-xs font-semibold">
              cycle
            </span>
          )}
          {!h.has_cycle && (
            <span className="rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)] px-2.5 py-0.5 text-xs font-semibold font-mono">
              depth {h.depth}
            </span>
          )}
          {isLargest && !h.has_cycle && (
            <span className="rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] px-2.5 py-0.5 text-xs font-semibold">
              largest
            </span>
          )}
        </div>
      </div>

      {h.has_cycle ? (
        <p className="text-sm text-[color:var(--muted-fg)]">
          Cycle detected in this component — tree is empty per spec.
        </p>
      ) : rootEntry ? (
        <TreeNode name={rootEntry[0]} kids={rootEntry[1]} />
      ) : null}
    </div>
  );
}

function Pill({ children, tone = "default", testId }) {
  const map = {
    default: "bg-[color:var(--surface-2)] text-[color:var(--fg)]",
    danger: "bg-[color:var(--danger)]/10 text-[color:var(--danger)]",
    warn: "bg-[color:var(--gold)]/15 text-[color:var(--gold)]",
  };
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center rounded-md px-2 py-1 font-mono text-xs ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, testId }) {
  return (
    <div
      data-testid={testId}
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
    >
      <div className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted-fg)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-bold text-[color:var(--fg)]">
        {value}
      </div>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState(DEFAULT_SAMPLE);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(null);

  const parsedCount = useMemo(
    () => input.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean).length,
    [input]
  );

  const handleSubmit = async () => {
    setError("");
    setResult(null);
    const dataArr = input
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (dataArr.length === 0) {
      setError("Please enter at least one edge (e.g. A->B).");
      return;
    }
    setLoading(true);
    const t0 = performance.now();
    try {
      const res = await axios.post(
        `${BACKEND_URL}${API_PATH}`,
        { data: dataArr },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );
      setResult(res.data);
      setElapsed(Math.round(performance.now() - t0));
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          e?.response?.data?.error ||
          e?.message ||
          "Request failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => setInput(DEFAULT_SAMPLE);
  const clearAll = () => {
    setInput("");
    setResult(null);
    setError("");
  };

  useEffect(() => {
    document.title = "BFHL — Hierarchy Analyzer";
  }, []);

  const largestRoot = result?.summary?.largest_tree_root;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)] font-sans antialiased">
      {/* Header */}
      <header className="border-b border-[color:var(--border)] bg-[color:var(--bg)]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[color:var(--accent)] grid place-items-center text-[color:var(--accent-fg)] font-mono font-bold">
              {"</>"}
            </div>
            <div>
              <div className="font-mono text-sm text-[color:var(--muted-fg)]">
                POST /bfhl
              </div>
              <div className="font-semibold tracking-tight">
                Hierarchy Analyzer
              </div>
            </div>
          </div>
          <div className="text-xs text-[color:var(--muted-fg)] font-mono hidden sm:block">
            SRM • Full Stack Round 1
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* Input panel */}
        <section className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              Parse edges,
              <br />
              <span className="text-[color:var(--accent)]">see the forest.</span>
            </h1>
            <p className="mt-2 text-sm text-[color:var(--muted-fg)] max-w-md">
              Enter parent→child edges one per line (e.g.{" "}
              <code className="font-mono text-[color:var(--fg)]">A-&gt;B</code>).
              We'll build the trees, flag cycles, invalid formats and duplicates.
            </p>
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[color:var(--border)] text-xs font-mono text-[color:var(--muted-fg)]">
              <span>data[]</span>
              <span data-testid="input-count">{parsedCount} entries</span>
            </div>
            <textarea
              data-testid="edges-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full resize-y bg-transparent px-4 py-3 font-mono text-sm outline-none placeholder:text-[color:var(--muted-fg)]"
              placeholder={"A->B\nA->C\nB->D"}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              data-testid="submit-button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] text-[color:var(--accent-fg)] px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing…" : "Analyze →"}
            </button>
            <button
              data-testid="sample-button"
              onClick={loadSample}
              className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium hover:bg-[color:var(--surface-2)] transition"
            >
              Load sample
            </button>
            <button
              data-testid="clear-button"
              onClick={clearAll}
              className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium hover:bg-[color:var(--surface-2)] transition"
            >
              Clear
            </button>
          </div>

          {error && (
            <div
              data-testid="error-banner"
              className="rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 text-[color:var(--danger)] px-4 py-3 text-sm"
            >
              {error}
            </div>
          )}

          {result && (
            <div className="text-xs text-[color:var(--muted-fg)] font-mono">
              <span data-testid="response-time">responded in {elapsed}ms</span>{" "}
              · <span>{result.user_id}</span>
            </div>
          )}
        </section>

        {/* Results panel */}
        <section className="space-y-6">
          {!result && !loading && (
            <div className="rounded-xl border border-dashed border-[color:var(--border)] p-10 text-center text-[color:var(--muted-fg)]">
              <div className="text-5xl font-mono mb-3">⟶</div>
              <p className="text-sm">Submit edges to see hierarchies, cycles and stats.</p>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-[color:var(--border)] p-10 text-center">
              <div className="animate-pulse text-sm text-[color:var(--muted-fg)] font-mono">
                processing graph…
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  testId="stat-trees"
                  label="trees"
                  value={result.summary.total_trees}
                />
                <StatCard
                  testId="stat-cycles"
                  label="cycles"
                  value={result.summary.total_cycles}
                />
                <StatCard
                  testId="stat-largest"
                  label="largest"
                  value={result.summary.largest_tree_root || "—"}
                />
              </div>

              {/* Hierarchies */}
              <div className="space-y-4">
                <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-[color:var(--muted-fg)]">
                  hierarchies ({result.hierarchies.length})
                </h2>
                <div
                  data-testid="hierarchies-grid"
                  className="grid gap-4 md:grid-cols-2"
                >
                  {result.hierarchies.map((h, i) => (
                    <HierarchyCard
                      key={`${h.root}-${i}`}
                      h={h}
                      isLargest={h.root === largestRoot}
                    />
                  ))}
                </div>
              </div>

              {/* Invalid + Duplicates */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[color:var(--muted-fg)]">
                      invalid_entries
                    </h3>
                    <span className="font-mono text-xs text-[color:var(--muted-fg)]">
                      {result.invalid_entries.length}
                    </span>
                  </div>
                  {result.invalid_entries.length === 0 ? (
                    <p className="text-sm text-[color:var(--muted-fg)]">
                      All entries valid.
                    </p>
                  ) : (
                    <div
                      data-testid="invalid-list"
                      className="flex flex-wrap gap-2"
                    >
                      {result.invalid_entries.map((x, i) => (
                        <Pill key={i} tone="danger">
                          {x || "∅"}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[color:var(--muted-fg)]">
                      duplicate_edges
                    </h3>
                    <span className="font-mono text-xs text-[color:var(--muted-fg)]">
                      {result.duplicate_edges.length}
                    </span>
                  </div>
                  {result.duplicate_edges.length === 0 ? (
                    <p className="text-sm text-[color:var(--muted-fg)]">
                      No duplicates.
                    </p>
                  ) : (
                    <div
                      data-testid="duplicates-list"
                      className="flex flex-wrap gap-2"
                    >
                      {result.duplicate_edges.map((x, i) => (
                        <Pill key={i} tone="warn">
                          {x}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Raw JSON */}
              <details className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]">
                <summary
                  data-testid="raw-json-toggle"
                  className="cursor-pointer select-none px-5 py-3 text-sm font-mono text-[color:var(--muted-fg)] hover:text-[color:var(--fg)]"
                >
                  raw response ↓
                </summary>
                <pre
                  data-testid="raw-json"
                  className="px-5 pb-5 text-xs font-mono overflow-x-auto text-[color:var(--fg)]"
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-[color:var(--border)] mt-8">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-[color:var(--muted-fg)] font-mono flex flex-wrap justify-between gap-2">
          <span>khushi kumari · RA2311003011224</span>
          <span>endpoint: {BACKEND_URL}{API_PATH}</span>
        </div>
      </footer>
    </div>
  );
}
