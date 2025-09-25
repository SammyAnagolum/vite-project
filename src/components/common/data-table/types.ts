import type { ReactNode } from "react";

export type SortDirection = "none" | "asc" | "desc";
export type SortState = { key: string | null; direction: SortDirection };

export type DataTableColumn<T> = {
    /** unique key (used for sorting & cells) */
    key: string;
    /** header content */
    header: ReactNode;
    /** cell renderer */
    cell: (row: T, rowIndex: number) => ReactNode;

    /** sorting (optional) */
    sortable?: boolean; // default true
    sortBy?: keyof T | string; // data key to read when sorting (fallback = key)
    sortValue?: (row: T) => unknown; // custom accessor (overrides sortBy)

    /** visuals */
    headClassName?: string;
    className?: string;
    align?: "left" | "center" | "right";
};
