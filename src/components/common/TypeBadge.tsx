import type { EntityType } from "@/lib/types";

export default function TypeBadge({ type }: { type: EntityType }) {
  const map: Record<EntityType, string> = {
    AA: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/25 dark:text-indigo-300 dark:ring-indigo-800/40",
    FIP: "bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/25 dark:text-sky-300 dark:ring-sky-800/40",
    FIU: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-800/40",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[type]}`}>
      {type}
    </span>
  );
}