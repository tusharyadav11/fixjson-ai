type Props = {
  onFix: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onClear: () => void;
  isLoading: boolean;
  canCopy: boolean;
  formatMode: "pretty" | "minified";
  onFormatModeChange: (mode: "pretty" | "minified") => void;
};

export default function ActionBar({
  onFix,
  onCopy,
  onDownload,
  onClear,
  isLoading,
  canCopy,
  formatMode,
  onFormatModeChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-[#fbfcfd] p-3 dark:border-slate-800 dark:bg-[#171a21]">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onFix}
          disabled={isLoading}
          className="group relative inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          <span
            className={
              isLoading
                ? "animate-spin text-base leading-none"
                : "text-base leading-none transition group-hover:rotate-12"
            }
            aria-hidden="true"
          >
            ✦
          </span>
          {isLoading ? "Fixing with AI..." : "Fix with AI"}
        </button>

        <button
          onClick={onCopy}
          disabled={!canCopy || isLoading}
          className="rounded-md border border-slate-300 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Copy
        </button>


        <button
          onClick={onDownload}
          disabled={!canCopy || isLoading}
          className="rounded-md border border-slate-300 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Download
        </button>
      </div>

      <button
        onClick={onClear}
        disabled={isLoading}
        className="rounded-md border border-slate-300 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Clear
      </button>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          value={formatMode}
          onChange={(event) =>
            onFormatModeChange(
              event.target.value as "pretty" | "minified"
            )
          }
          className="rounded-md border border-slate-300 bg-white/60 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
        >
          <option value="pretty">Pretty</option>
          <option value="minified">Minified</option>
        </select>
      </div>
    </div>
  );
}
