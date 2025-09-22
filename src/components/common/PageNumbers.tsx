import { Button } from "../ui/button";

export default function PageNumbers({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = buildWindow(page, totalPages);
  return (
    <div className="flex items-center gap-1">
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`gap-${idx}`} className="px-1 text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            className="h-8 min-w-[2rem] px-2"
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        )
      )}
    </div>
  );
}

function buildWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current]);
  if (current - 1 > 1) set.add(current - 1);
  if (current + 1 < total) set.add(current + 1);
  if (current - 2 > 1) set.add(current - 2);
  if (current + 2 < total) set.add(current + 2);
  const arr = Array.from(set).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(arr[i]);
    if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("…");
  }
  return out;
}