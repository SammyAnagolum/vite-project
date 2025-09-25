import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import type { DataTableColumn, SortState } from "./data-table/types";

export default function DataTable<T>({
  data,
  columns,
  showIndex = true,
  indexHeader = "S.NO",
  startIndex = 1,
  indexColClassName = "w-[80px] text-center",
  loading,
  error,
  emptyMessage = "Nothing to show.",
  emptyContent,
  loadingContent,
  errorContent,
  // getRowKey,
  stickyHeader = true,
  zebra = true,
  hover = true,
  containerClassName,
  tableClassName,
  theadClassName,
  tbodyClassName,
  sort,
  onSortChange,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  showIndex?: boolean;
  indexHeader?: React.ReactNode;
  startIndex?: number;
  indexColClassName?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  getRowKey?: (row: T, rowIndex: number) => string;
  stickyHeader?: boolean;
  zebra?: boolean;
  hover?: boolean;
  containerClassName?: string;
  tableClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
}) {
  const [internalSort, setInternalSort] = React.useState<SortState>({
    key: null,
    direction: "none",
  });
  const effSort = sort ?? internalSort;

  const updateSort = React.useCallback(
    (updater: (prev: SortState) => SortState) => {
      if (onSortChange) {
        // controlled: compute next from current effective sort
        onSortChange(updater(effSort));
      } else {
        // uncontrolled: use functional updater
        setInternalSort(updater);
      }
    },
    [onSortChange, effSort]
  );

  const colCount = columns.length + (showIndex ? 1 : 0);

  const alignClass = (a: DataTableColumn<T>["align"]) =>
    a === "center" ? "text-center"
      : a === "right" ? "text-right tabular-nums"
        : "text-left";

  const toggleSort = (key: string, sortable?: boolean) => {
    if (sortable === false) return;
    updateSort((prev: SortState) => {
      if (prev.key !== key) return { key, direction: "asc" as const };
      if (prev.direction === "asc") return { key, direction: "desc" as const };
      if (prev.direction === "desc") return { key: null, direction: "none" as const };
      return { key, direction: "asc" as const };
    });
  };

  return (
    <div className={cn("relative overflow-auto rounded-lg border border-border", containerClassName)}>
      <Table className={cn("w-full text-sm", tableClassName)}>
        <TableHeader
          className={cn(
            stickyHeader &&
            "sticky top-0 z-10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-[0_1px_0_var(--color-border)]",
            "border-b border-border",
            theadClassName
          )}
        >
          <TableRow className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium [&>th]:text-left">
            {showIndex && (
              <TableHead className={indexColClassName}>{indexHeader}</TableHead>
            )}
            {columns.map((c) => {
              const sortable = c.sortable ?? true;
              // const active = effSort.key === c.key && effSort.direction !== "none";
              return (
                <TableHead
                  key={c.key}
                  className={cn(
                    alignClass(c.align),
                    c.headClassName,
                    sortable && "cursor-pointer select-none"
                  )}
                  onClick={() => toggleSort(c.key, sortable)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sortable && (
                      <span className="text-muted-foreground">
                        {effSort.key !== c.key || effSort.direction === "none" ? "↕" : effSort.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody className={cn("[&>tr]:border-b [&>tr]:border-border", tbodyClassName)}>
          {loading ? (
            <TableRow>
              <TableCell colSpan={colCount} className="px-3 py-10 text-center text-muted-foreground">
                {loadingContent ?? "Loading…"}
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={colCount} className="px-3 py-10 text-center text-destructive">
                {errorContent ?? error}
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="px-3 py-12 text-center">
                {emptyContent ?? <span className="text-muted-foreground">{emptyMessage}</span>}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => {
              const key = (typeof (row as any)?.id === "string") // eslint-disable-line @typescript-eslint/no-explicit-any
                ? (row as any).id // eslint-disable-line @typescript-eslint/no-explicit-any
                : (typeof (row as any)?.key === "string") // eslint-disable-line @typescript-eslint/no-explicit-any
                  ? (row as any).key // eslint-disable-line @typescript-eslint/no-explicit-any
                  : (typeof (row as any)?.requestId === "string") // eslint-disable-line @typescript-eslint/no-explicit-any
                    ? (row as any).requestId // eslint-disable-line @typescript-eslint/no-explicit-any
                    : (typeof (row as any)?.entity_id === "string") // eslint-disable-line @typescript-eslint/no-explicit-any
                      ? (row as any).entity_id // eslint-disable-line @typescript-eslint/no-explicit-any
                      : String(i);

              return (
                <TableRow
                  key={key}
                  className={cn(
                    zebra && "odd:bg-muted/40",
                    hover && "hover:bg-accent transition-colors"
                  )}
                >
                  {showIndex && (
                    <TableCell className={cn("px-3 py-3 text-center tabular-nums", indexColClassName)}>
                      {startIndex + i}
                    </TableCell>
                  )}
                  {columns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={cn("px-3", showIndex ? "py-1" : "py-3", alignClass(c.align), c.className)}
                    >
                      {c.cell(row, i)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
