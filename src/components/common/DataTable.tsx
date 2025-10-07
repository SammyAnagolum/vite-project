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
  FileSpreadsheet,
} from "lucide-react";
import PageNumbers from "@/components/common/PageNumbers";
import type { DataTableColumn, SortState } from "./data-table/types";
import { sortRows } from "./data-table/sort";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function DataTable<T>({
  data,
  columns,
  className,
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
  exportExcelFilename, // <-- NEW
  exportInfo,
  exportExcludeKeys = [],

  // Inital Default sort
  initialSort
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  className?: string;
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

  /** If set, shows a Download button and exports **Excel (.xlsx)** of all processed rows */
  exportExcelFilename?: string;

  /** Optional key/value pairs (filters or context) to render above the header in Excel */
  exportInfo?: Array<{ label: string; value: string }>;

  /** Additional column keys to exclude from CSV/XLSX exports (default already excludes "actions") */
  exportExcludeKeys?: string[];

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
  }, [isControlled, initialSort?.key, initialSort?.direction]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Helpers: get plain text out of any cell value (including React elements)
  function toPlainText(v: unknown): string {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map(toPlainText).join("");
    // React element?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (React.isValidElement(v as any)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walk = (node: any): string => {
        if (node == null) return "";
        if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") return String(node);
        if (Array.isArray(node)) return node.map(walk).join("");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (React.isValidElement(node)) return walk((node as any).props?.children);
        return "";
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return walk((v as any).props?.children);
    }
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  // Compute exportable columns (exclude "actions" by default + any caller-specified keys)
  const exportableColumns = React.useMemo(
    () => {
      const excluded = new Set<string>(["actions", ...exportExcludeKeys.map(String)]);
      return columns.filter(c => !excluded.has(String(c.key)));
    },
    [columns, exportExcludeKeys]
  );

  // --- export CSV (all processed rows, not just current page) ---
  function exportCsv() {
    if (!exportCsvFilename) return;
    const headers = exportableColumns.map((c) =>
      typeof c.header === "string" ? c.header : String(c.key)
    );

    const matrix = processed.map((row, i) =>
      exportableColumns.map((c) => {
        let val: unknown = "";
        if (c.exportValue) val = c.exportValue(row, i);
        else if (typeof c.sortBy === "function") val = c.sortBy(row);
        else if (typeof c.sortBy === "string") val = (row as any)[c.sortBy]; // eslint-disable-line @typescript-eslint/no-explicit-any
        else if (typeof (row as any)[c.key] !== "undefined") val = (row as any)[c.key]; // eslint-disable-line @typescript-eslint/no-explicit-any
        return toPlainText(val);
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

  // --- export Excel (all processed rows; only exportable columns; optional exportInfo preamble) ---
  async function exportExcel() {
    if (!exportExcelFilename) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Data");

    // Optional preamble (filters/context)
    if (exportInfo && exportInfo.length) {
      const hdr = ws.addRow(["FILTERS", ""]);
      hdr.getCell(1).font = { bold: true };
      exportInfo.forEach(({ label, value }) => {
        const r = ws.addRow([label ?? "", value ?? ""]);
        r.getCell(1).font = { bold: true };
        r.eachCell((cell) => (cell.alignment = { horizontal: "left", vertical: "middle" }));
      });
      ws.addRow([]); // spacer
    }

    // Header
    const header = exportableColumns.map((c) =>
      typeof c.header === "string" ? c.header : String(c.key)
    );
    const headerRowNum = ws.rowCount + 1;
    const headerRow = ws.addRow(header);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    // Data rows
    processed.forEach((row, i) => {
      const cells = exportableColumns.map((c) => {
        let val: unknown = "";
        if (c.exportValue) val = c.exportValue(row, i);
        else if (typeof c.sortBy === "function") val = c.sortBy(row);
        else if (typeof c.sortBy === "string") val = (row as any)[c.sortBy]; // eslint-disable-line @typescript-eslint/no-explicit-any
        else if (typeof (row as any)[c.key] !== "undefined") val = (row as any)[c.key]; // eslint-disable-line @typescript-eslint/no-explicit-any
        return toPlainText(val);
      });
      ws.addRow(cells);
    });

    // Align & widths
    ws.eachRow((row) =>
      row.eachCell((cell) => (cell.alignment = { horizontal: "left", vertical: "middle", wrapText: false }))
    );
    exportableColumns.forEach((c, i) => {
      ws.getColumn(i + 1).width = Math.max(14, String(typeof c.header === "string" ? c.header : c.key).length + 6);
    });

    // Freeze top (including preamble) and add AutoFilter on header row
    ws.views = [{ state: "frozen", ySplit: headerRowNum }];
    ws.autoFilter = { from: { row: headerRowNum, column: 1 }, to: { row: headerRowNum, column: exportableColumns.length } };

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), exportExcelFilename);
  }

  const colCount = columns.length + (showIndex ? 1 : 0);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
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
      {(exportCsvFilename || exportExcelFilename || paginate) && (
        <div className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {exportExcelFilename && (
              <Button onClick={exportExcel} variant="outline" disabled={data.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            )}
            {exportCsvFilename && (
              <Button onClick={exportCsv} disabled={data.length === 0}>
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
