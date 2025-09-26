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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Download,
} from "lucide-react";
import PageNumbers from "@/components/common/PageNumbers";
import type { DataTableColumn, SortState } from "./data-table/types";
import { sortRows } from "./data-table/sort";

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
  getRowKey,
  stickyHeader = true,
  zebra = true,
  hover = true,
  containerClassName,
  tableClassName,
  theadClassName,
  tbodyClassName,

  // Sorting
  clientSort = true,
  sort,
  onSortChange,

  // Pagination
  paginate = true,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],

  // Export
  exportCsvFilename,

  // Inital Default sort
  initialSort
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

  /** Enable built-in client sorting (uses `sortRows`). Default: true */
  clientSort?: boolean;
  /** Controlled sort (kept for backward compatibility) */
  sort?: SortState;
  onSortChange?: (next: SortState) => void;

  /** Enable built-in pagination. Default: true */
  paginate?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];

  /** If set, shows a Download button and exports CSV of all processed rows */
  exportCsvFilename?: string;

  /** Initial sort for uncontrolled mode */
  initialSort?: SortState;
}) {
  // --- sort state (controlled/uncontrolled) ---
  const isControlled = typeof sort !== "undefined";
  const [internalSort, setInternalSort] = React.useState<SortState>(
    () =>
      initialSort ?? {
        key: null,
        direction: "none",
      }
  );
  // If caller changes initialSort later, only apply when uncontrolled and value actually differs
  React.useEffect(() => {
    if (!isControlled && initialSort) {
      setInternalSort((prev) =>
        prev.key === initialSort.key && prev.direction === initialSort.direction ? prev : initialSort
      );
    }
  }, [isControlled, initialSort?.key, initialSort?.direction]);

  const effSort = sort ?? internalSort;

  const updateSort = React.useCallback(
    (updater: (prev: SortState) => SortState) => {
      if (onSortChange) {
        onSortChange(updater(effSort)); // controlled
      } else {
        setInternalSort(updater);       // uncontrolled
      }
    },
    [onSortChange, effSort]
  );

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

  // --- process rows (sort → paginate) ---
  const processed = React.useMemo(
    () => (clientSort ? sortRows(data, columns, effSort) : data),
    [clientSort, data, columns, effSort]
  );

  // pagination state is internal & resets on sort or data/pageSize change
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  React.useEffect(() => setPage(1), [pageSize, processed, effSort.key, effSort.direction]);

  const totalRows = processed.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const startOffset = paginate ? (page - 1) * pageSize : 0;
  const pageRows = paginate ? processed.slice(startOffset, startOffset + pageSize) : processed;
  const rangeStart = totalRows === 0 ? 0 : startOffset + 1;
  const rangeEnd = Math.min(startOffset + pageSize, totalRows);

  // --- export CSV (all processed rows, not just current page) ---
  function exportCsv() {
    if (!exportCsvFilename) return;
    const headers = columns.map((c) =>
      typeof c.header === "string" ? c.header : String(c.key)
    );

    const matrix = processed.map((row, i) =>
      columns.map((c) => {
        // exportValue → sortBy (fn) → sortBy (key) → direct key → fallback empty
        if (c.exportValue) return c.exportValue(row, i);
        if (typeof c.sortBy === "function") return c.sortBy(row);
        if (typeof c.sortBy === "string") return (row as any)[c.sortBy]; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (typeof (row as any)[c.key] !== "undefined") return (row as any)[c.key]; // eslint-disable-line @typescript-eslint/no-explicit-any
        return "";
      })
    );

    const csv = [headers, ...matrix]
      .map((r) => r.map(safeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportCsvFilename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const colCount = columns.length + (showIndex ? 1 : 0);

  return (
    <div>
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
              {showIndex && <TableHead className={indexColClassName}>{indexHeader}</TableHead>}
              {columns.map((c) => {
                const sortable = c.sortable ?? true;
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
                          {effSort.key !== c.key || effSort.direction === "none"
                            ? "↕"
                            : effSort.direction === "asc"
                              ? "↑"
                              : "↓"}
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
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="px-3 py-12 text-center">
                  {emptyContent ?? <span className="text-muted-foreground">{emptyMessage}</span>}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, i) => {
                const key =
                  getRowKey?.(row, i) ??
                  (typeof (row as any)?.id === "string" // eslint-disable-line @typescript-eslint/no-explicit-any
                    ? (row as any).id // eslint-disable-line @typescript-eslint/no-explicit-any
                    : typeof (row as any)?.key === "string" // eslint-disable-line @typescript-eslint/no-explicit-any
                      ? (row as any).key // eslint-disable-line @typescript-eslint/no-explicit-any
                      : typeof (row as any)?.requestId === "string" // eslint-disable-line @typescript-eslint/no-explicit-any
                        ? (row as any).requestId // eslint-disable-line @typescript-eslint/no-explicit-any
                        : typeof (row as any)?.entity_id === "string" // eslint-disable-line @typescript-eslint/no-explicit-any
                          ? (row as any).entity_id // eslint-disable-line @typescript-eslint/no-explicit-any
                          : String(i));

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
                        {startIndex + startOffset + i}
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

      {/* Footer: Export + Pagination (only when enabled) */}
      {(exportCsvFilename || paginate) && (
        <div className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {exportCsvFilename && (
              <Button onClick={exportCsv}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            )}
          </div>

          {paginate && (
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="text-xs text-muted-foreground">
                Rows {rangeStart}-{rangeEnd} of {totalRows}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-[84px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <PageNumbers page={page} totalPages={totalPages} onChange={setPage} />

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** local CSV helper (keeps callers simple) */
function safeCsv(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
