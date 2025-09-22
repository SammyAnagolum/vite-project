// src/components/common/Table.tsx
type Col<T> = { key: keyof T | string; header: string; className?: string; render?: (row: T) => React.ReactNode };

export function Table<T extends Record<string, any>>({ // eslint-disable-line @typescript-eslint/no-explicit-any
  columns,
  rows,
  empty = "No records found",
}: {
  columns: Col<T>[];
  rows: T[];
  empty?: string;
}) {
  if (!rows?.length)
    return <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">{empty}</div>;

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-[hsl(var(--muted))]">
          <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
            {columns.map((c) => (
              <th key={String(c.key)} className={c.className}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-[hsl(var(--muted))]/50">
              {columns.map((c) => (
                <td key={String(c.key)} className={["px-3 py-2", c.className].filter(Boolean).join(" ")}>
                  {c.render ? c.render(r) : (r[c.key as keyof T] as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
