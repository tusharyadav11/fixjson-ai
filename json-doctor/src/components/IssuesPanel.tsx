import type { JsonIssue } from "../types/json";

type Props = {
  issues: JsonIssue[];
};

export default function IssuesPanel({
  issues,
}: Props) {
  return (
    <div className="rounded-md border border-slate-200 bg-[#fbfcfd] p-4 dark:border-slate-800 dark:bg-[#171a21]">
      <h2 className="mb-3 text-sm font-semibold">
        Issues
      </h2>

      {!issues.length && (
        <p className="text-sm text-slate-500 dark:text-slate-500">
          No issues detected yet.
        </p>
      )}

      <ul className="space-y-2">
        {issues.map((issue, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-200"
          >
            <span
              className={
                issue.severity === "error"
                  ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500"
                  : "mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500"
              }
            />
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
