type JsonEditorProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
};

export default function JsonEditor({
  value,
  onChange,
  maxLength,
}: JsonEditorProps) {
  const lineCount = Math.max(value.split("\n").length, 1);
  const lineNumbers = Array.from(
    { length: lineCount },
    (_, index) => index + 1
  );

  return (
    <div className="flex h-[420px] overflow-hidden rounded-md border border-slate-200 bg-[#fbfcfd] dark:border-slate-800 dark:bg-[#171a21]">
      <div className="select-none overflow-hidden border-r border-slate-200 bg-slate-100/70 px-3 py-4 text-right font-mono text-sm leading-6 text-slate-400 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-600">
        {lineNumbers.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-100 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:ring-blue-950/70"
        placeholder="Paste broken JSON here..."
      />
    </div>
  );
}
