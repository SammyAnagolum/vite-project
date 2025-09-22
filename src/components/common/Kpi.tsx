export default function Kpi({
  icon,
  title,
  value,
  tone = "default",
}: {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  tone?: "default" | "indigo" | "sky" | "emerald" | "amber" | "red";
}) {
  const toneClass =
    tone === "indigo"
      ? "ring-indigo-200 bg-indigo-50 dark:ring-indigo-800/30 dark:bg-indigo-900/20"
      : tone === "sky"
        ? "ring-sky-200 bg-sky-50 dark:ring-sky-800/30 dark:bg-sky-900/20"
        : tone === "emerald"
          ? "ring-emerald-200 bg-emerald-50 dark:ring-emerald-800/30 dark:bg-emerald-900/20"
          : tone === "amber"
            ? "ring-amber-200 bg-amber-50 dark:ring-amber-800/30 dark:bg-amber-900/20"
            : tone === "red"
              ? "ring-red-200 bg-red-50 dark:ring-red-800/30 dark:bg-red-900/20"
              : "ring-border bg-card";
  return (
    <div className={`rounded-xl border border-border p-4 ring-1 ${toneClass}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="rounded-lg bg-background/60 p-2">{icon}</div>}
        <div>
          <div className="text-xs font-medium text-muted-foreground">{title}</div>
          <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      </div>
    </div>
  );
}