import { useEffect, useRef, useState } from "react";

type Props = {
  fixed: string;
  mode: "pretty" | "minified";
  // Bump this whenever a fresh repair completes to replay the typewriter
  // reveal. Loading older results (e.g. from history) should leave it
  // unchanged so the output appears instantly.
  revealKey?: number;
};

function formatJson(value: string) {
  if (!value) return "";

  try {
    return JSON.stringify(
      JSON.parse(value),
      null,
      2
    );
  } catch {
    return value;
  }
}

export default function FixedJsonViewer({
  fixed,
  mode,
  revealKey = 0,
}: Props) {
  let formattedFixed = formatJson(fixed);

  if (mode === "minified" && fixed) {
    try {
      formattedFixed = JSON.stringify(JSON.parse(fixed));
    } catch {
      formattedFixed = fixed;
    }
  }

  // While `revealed` is null the full text is shown live (so toggling
  // pretty/minified still works); during the animation it holds the
  // partial, typed-so-far slice.
  const [revealed, setRevealed] = useState<string | null>(null);
  const targetRef = useRef(formattedFixed);
  targetRef.current = formattedFixed;

  useEffect(() => {
    const target = targetRef.current;

    if (!revealKey || !target) {
      setRevealed(null);
      return;
    }

    setRevealed("");
    let index = 0;
    const step = Math.max(1, Math.ceil(target.length / 140));
    const timer = setInterval(() => {
      index = Math.min(target.length, index + step);
      setRevealed(target.slice(0, index));

      if (index >= target.length) {
        clearInterval(timer);
        setRevealed(null);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [revealKey]);

  const isTyping = revealed !== null;
  const display = isTyping ? revealed : formattedFixed;
  const lineNumbers = display
    ? display.split("\n").map((_, index) => index + 1)
    : [];

  return (
    <div className="flex h-[420px] overflow-hidden rounded-md border border-slate-200 bg-[#fbfcfd] dark:border-slate-800 dark:bg-[#171a21]">
      {fixed ? (
        <>
          <div className="select-none overflow-hidden border-r border-slate-200 bg-slate-100/70 px-3 py-4 text-right font-mono text-sm leading-6 text-slate-400 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-600">
            {lineNumbers.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>

          <pre className="h-full flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 text-slate-950 dark:text-slate-100">
            {display}
            {isTyping && (
              <span className="ml-0.5 inline-block w-2 animate-pulse bg-indigo-500 align-middle">
                &nbsp;
              </span>
            )}
          </pre>
        </>
      ) : (
        <div className="flex h-full flex-1 items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-500">
          Fixed JSON will appear here after repair.
        </div>
      )}
    </div>
  );
}
