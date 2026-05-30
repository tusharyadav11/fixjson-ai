"use client";

import { useEffect, useState } from "react";

import JsonEditor from "@/src/components/JsonEditor";
import ActionBar from "@/src/components/ActionBar";
import IssuesPanel from "@/src/components/IssuesPanel";
import FixedJsonViewer from "@/src/components/FixedJsonViewer";

import { fixJson } from "@/src/lib/fixer";
import type { FixResult, JsonIssue } from "@/src/types/json";

type RepairJsonResponse = {
  repaired?: unknown;
  repairedText?: string;
  summary?: string | null;
  changes?: string[];
  error?: string;
};

type Theme = "light" | "dark";
type FormatMode = "pretty" | "minified";
type HistoryItem = {
  id: string;
  input: string;
  fixed: string;
  createdAt: string;
};

const MAX_INPUT_LENGTH = 50_000;
const HISTORY_KEY = "json-doctor-history";
const loadingSteps = [
  "Analyzing JSON...",
  "Detecting structure issues...",
  "Repairing syntax...",
];

function prettifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const savedTheme = localStorage.getItem("json-doctor-theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("json-doctor-theme", theme);
}

function getInitialHistory() {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    ) as HistoryItem[];
  } catch {
    return [];
  }
}

function saveHistory(input: string, fixed: string) {
  const item: HistoryItem = {
    id: crypto.randomUUID(),
    input,
    fixed,
    createdAt: new Date().toISOString(),
  };
  const existing = JSON.parse(
    localStorage.getItem(HISTORY_KEY) || "[]"
  ) as HistoryItem[];
  const next = [item, ...existing].slice(0, 10);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));

  return next;
}

function calculateConfidence(result: FixResult, usedAi: boolean) {
  if (!result.success) return 25;
  if (usedAi) return 86;
  if (result.issues.length) return 94;
  return 99;
}

export default function Home() {
  const [input, setInput] = useState(
    `{
  id: 101,
  name: 'Acme Corp',
  email: 'contact@acme.com',
  active: true,
}`
  );
  const [result, setResult] = useState<FixResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [formatMode, setFormatMode] = useState<FormatMode>("pretty");
  const [loadingMessage, setLoadingMessage] = useState(loadingSteps[0]);
  const [history, setHistory] = useState<HistoryItem[]>(
    getInitialHistory
  );
  const [confidence, setConfidence] = useState<number | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [changes, setChanges] = useState<string[]>([]);
  const [revealKey, setRevealKey] = useState(0);
  const isDarkMode = theme === "dark";
  const statusText = result?.success
    ? "Valid JSON ready"
    : result
      ? "Repair needs attention"
      : "Paste JSON to begin";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";

      applyTheme(nextTheme);

      return nextTheme;
    });
  };

  const handleFix = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      setResult({
        success: false,
        valid: false,
        original: input,
        fixed: "",
        issues: [
          {
            type: "empty_input",
            message: "Paste JSON before running repair",
            severity: "error",
          },
        ],
        error: "Paste JSON before running repair.",
      });
      return;
    }

    if (input.length > MAX_INPUT_LENGTH) {
      setResult({
        success: false,
        valid: false,
        original: input,
        fixed: "",
        issues: [
          {
            type: "input_too_large",
            message: `Input is larger than ${MAX_INPUT_LENGTH.toLocaleString()} characters`,
            severity: "error",
          },
        ],
        error: `Input is too large. Keep it under ${MAX_INPUT_LENGTH.toLocaleString()} characters.`,
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage(loadingSteps[0]);

    const localResult = fixJson(input);
    setLoadingMessage(loadingSteps[1]);

    if (localResult.success) {
      setResult(localResult);
      setConfidence(calculateConfidence(localResult, false));
      setUsedAi(false);
      setSummary(
        localResult.issues.length
          ? "Cleaned up your JSON and validated the result."
          : "Your JSON was already valid — just formatted it."
      );
      setChanges(localResult.issues.map((issue) => issue.message));
      setRevealKey((key) => key + 1);
      setHistory(saveHistory(input, localResult.fixed));
      setIsLoading(false);
      return;
    }

    try {
      setLoadingMessage(loadingSteps[2]);

      const res = await fetch("/api/repair-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ json: input }),
      });

      const data = (await res.json()) as RepairJsonResponse;

      if (!res.ok) {
        throw new Error(data.error || "AI repair failed");
      }

      if (data.repaired === undefined) {
        throw new Error("AI returned no repaired JSON");
      }

      const fixed = prettifyJson(data.repaired);
      const issues: JsonIssue[] = [
        ...localResult.issues,
        {
          type: "ai_repair",
          message: "AI repair used after rule-based repair failed",
          severity: "warning",
        },
      ];

      setResult({
        success: true,
        valid: true,
        original: input,
        fixed,
        issues,
        error: null,
      });
      setConfidence(86);
      setUsedAi(true);
      setSummary(data.summary ?? "AI repaired your JSON and validated the result.");
      setChanges(
        data.changes?.length
          ? data.changes
          : localResult.issues.map((issue) => issue.message)
      );
      setRevealKey((key) => key + 1);
      setHistory(saveHistory(input, fixed));
    } catch (error) {
      setResult({
        ...localResult,
        error:
          error instanceof Error
            ? `AI repair failed. Showing local result: ${error.message}`
            : "AI repair failed. Showing local result.",
      });
      setConfidence(calculateConfidence(localResult, false));
      setUsedAi(false);
      setSummary(null);
      setChanges([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.fixed) return;

    await navigator.clipboard.writeText(result.fixed);
  };

  const handleDownload = () => {
    if (!result?.fixed) return;

    const blob = new Blob([result.fixed], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "repaired.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput("");
    setResult(null);
    setConfidence(null);
    setUsedAi(false);
    setSummary(null);
    setChanges([]);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleFix();
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        void handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-slate-950 transition-colors dark:bg-[#111318] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              FixJson.ai
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Repair malformed JSON, validate output, and copy the clean result.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleThemeToggle}
              className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {isDarkMode ? "Light mode" : "Dark mode"}
            </button>

            <div
              className={
                result?.success
                  ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : result
                    ? "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/60 dark:text-rose-300"
                    : "rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }
            >
              {isLoading ? loadingMessage : statusText}
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    Before
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {input.length.toLocaleString()} / {MAX_INPUT_LENGTH.toLocaleString()}
                  </span>
                </div>
                <JsonEditor
                  value={input}
                  onChange={setInput}
                  maxLength={MAX_INPUT_LENGTH}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    After
                  </h2>
                  {usedAi && result?.success ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/40 dark:from-violet-950/60 dark:to-indigo-950/60 dark:text-indigo-300">
                      <span className="animate-pulse" aria-hidden="true">
                        ✦
                      </span>
                      AI Repaired
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      Pretty JSON
                    </span>
                  )}
                </div>
                <FixedJsonViewer
                  fixed={result?.success ? result.fixed : ""}
                  mode={formatMode}
                  revealKey={revealKey}
                />
              </div>
            </div>

            <ActionBar
              onFix={handleFix}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onClear={handleClear}
              isLoading={isLoading}
              canCopy={Boolean(result?.success && result.fixed)}
              formatMode={formatMode}
              onFormatModeChange={setFormatMode}
            />
          </div>

          <aside className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-[#fbfcfd] p-4 dark:border-slate-800 dark:bg-[#171a21]">
              <h2 className="mb-3 text-sm font-semibold">
                Confidence
              </h2>
              <p className="text-2xl font-semibold">
                {confidence === null ? "--" : `${confidence}%`}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                {confidence === null
                  ? "Run a repair to score the output."
                  : confidence >= 85
                    ? "High confidence repair."
                    : "Review carefully before using."}
              </p>
            </div>

            {result?.success && (summary || changes.length > 0) && (
              <div className="rounded-md border border-indigo-200 bg-gradient-to-br from-violet-50 to-indigo-50/60 p-4 dark:border-indigo-500/30 dark:from-violet-950/40 dark:to-indigo-950/30">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  <span aria-hidden="true">✦</span>
                  {usedAi ? "What the AI fixed" : "What we fixed"}
                </h2>

                {changes.length > 0 && (
                  <ul className="space-y-2">
                    {changes.map((change, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <span
                          className="mt-0.5 text-indigo-500 dark:text-indigo-400"
                          aria-hidden="true"
                        >
                          ✦
                        </span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {summary && (
                  <p className="mt-3 border-t border-indigo-200/70 pt-3 text-sm italic text-slate-600 dark:border-indigo-500/20 dark:text-slate-400">
                    “{summary}”
                  </p>
                )}
              </div>
            )}

            {result && !result.success && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/70 dark:bg-rose-950/60">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                  Unable to repair completely
                </p>

                <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">
                  {result.error}
                </p>
              </div>
            )}

            <IssuesPanel issues={result?.issues ?? []} />

            <div className="rounded-md border border-slate-200 bg-[#fbfcfd] p-4 dark:border-slate-800 dark:bg-[#171a21]">
              <h2 className="mb-3 text-sm font-semibold">
                History
              </h2>
              {!history.length && (
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Last 10 repairs will appear here.
                </p>
              )}
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setInput(item.input);
                      setResult({
                        success: true,
                        valid: true,
                        original: item.input,
                        fixed: item.fixed,
                        issues: [],
                        error: null,
                      });
                      setConfidence(99);
                      setUsedAi(false);
                      setSummary(null);
                      setChanges([]);
                    }}
                    className="block w-full truncate rounded border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {item.input.slice(0, 42)}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
