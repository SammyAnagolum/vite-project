import type { DataTableColumn, SortState } from "./types";

type Sortable = string | number | boolean | Date | null;

function toPrimitive(v: unknown): Sortable {
    if (v == null) return null;
    if (v instanceof Date) return v;
    const t = typeof v;
    if (t === "number" || t === "boolean") return v as number | boolean;
    return String(v).toLowerCase();
}

function getAccessor<T>(col: DataTableColumn<T>): (row: T) => unknown {
    if (col.sortValue) return col.sortValue;
    if (col.sortBy) {
        const k = col.sortBy as keyof T;
        return (row: T) => (row as any)[k]; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    return (row: T) => (row as any)[col.key]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Canonical sort used by all pages. Apply it *before* pagination. */
export function sortRows<T>(rows: T[], columns: DataTableColumn<T>[], sort: SortState): T[] {
    if (!sort || sort.direction === "none" || !sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key && (c.sortable ?? true));
    if (!col) return rows;

    const acc = getAccessor(col);
    const dir = sort.direction === "asc" ? 1 : -1;

    return [...rows]
        .map((row, idx) => ({ row, idx, val: toPrimitive(acc(row)) }))
        .sort((a, b) => {
            const av = a.val,
                bv = b.val;
            if (av === null && bv === null) return a.idx - b.idx;
            if (av === null) return 1;
            if (bv === null) return -1;

            const aNum = av instanceof Date ? av.getTime() : (av as any); // eslint-disable-line @typescript-eslint/no-explicit-any
            const bNum = bv instanceof Date ? bv.getTime() : (bv as any); // eslint-disable-line @typescript-eslint/no-explicit-any

            if (aNum < bNum) return -1 * dir;
            if (aNum > bNum) return 1 * dir;
            return a.idx - b.idx; // stable
        })
        .map((x) => x.row);
}
