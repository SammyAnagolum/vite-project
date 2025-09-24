import * as React from "react";

type Tone = "default" | "purple" | "indigo" | "sky" | "emerald" | "lime" | "yellow" | "amber" | "red";

const toneMap: Record<
  Tone,
  { card: string; iconWrap: string; icon: string }
> = {
  default: {
    card: "ring-border bg-card",
    iconWrap: "bg-background/60",
    icon: "text-foreground/70",
  },
  purple: {
    card: "ring-purple-200 bg-purple-50 dark:ring-purple-800/30 dark:bg-purple-900/20",
    iconWrap: "bg-purple-100/60 dark:bg-purple-900/40",
    icon: "text-purple-700 dark:text-purple-300",
  },
  indigo: {
    card: "ring-indigo-200 bg-indigo-50 dark:ring-indigo-800/30 dark:bg-indigo-900/20",
    iconWrap: "bg-indigo-100/60 dark:bg-indigo-900/40",
    icon: "text-indigo-700 dark:text-indigo-300",
  },
  sky: {
    card: "ring-sky-200 bg-sky-50 dark:ring-sky-800/30 dark:bg-sky-900/20",
    iconWrap: "bg-sky-100/60 dark:bg-sky-900/40",
    icon: "text-sky-700 dark:text-sky-300",
  },
  emerald: {
    card: "ring-emerald-200 bg-emerald-50 dark:ring-emerald-800/30 dark:bg-emerald-900/20",
    iconWrap: "bg-emerald-100/60 dark:bg-emerald-900/40",
    icon: "text-emerald-700 dark:text-emerald-300",
  },
  lime: {
    card: "ring-lime-200 bg-lime-50 dark:ring-lime-800/30 dark:bg-lime-900/20",
    iconWrap: "bg-lime-100/60 dark:bg-lime-900/40",
    icon: "text-lime-700 dark:text-lime-300",
  },
  yellow: {
    card: "ring-yellow-200 bg-yellow-50 dark:ring-yellow-800/30 dark:bg-yellow-900/20",
    iconWrap: "bg-yellow-100/60 dark:bg-yellow-900/40",
    icon: "text-yellow-700 dark:text-yellow-300",
  },
  amber: {
    card: "ring-amber-200 bg-amber-50 dark:ring-amber-800/30 dark:bg-amber-900/20",
    iconWrap: "bg-amber-100/60 dark:bg-amber-900/40",
    icon: "text-amber-700 dark:text-amber-300",
  },
  red: {
    card: "ring-red-200 bg-red-50 dark:ring-red-800/30 dark:bg-red-900/20",
    iconWrap: "bg-red-100/60 dark:bg-red-900/40",
    icon: "text-red-700 dark:text-red-300",
  },
};

export default function Kpi({
  icon,
  title,
  value,
  tone = "default",
}: {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  tone?: Tone;
}) {
  const t = toneMap[tone];
  return (
    <div className={`rounded-xl border border-border px-4 ring-1 ${t.card}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`rounded-lg p-2 ${t.iconWrap}`}>
            {/* apply tone color to the icon */}
            <div className={t.icon}>{icon}</div>
          </div>
        )}
        <div className="py-4">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      </div>
    </div>
  );
}
