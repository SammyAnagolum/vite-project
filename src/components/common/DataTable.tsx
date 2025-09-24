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

export type DataTableColumn<T> = {
  /** unique key */
  key: string;
  /** header content */
  header: React.ReactNode;
  /** cell renderer */
  cell: (row: T, rowIndex: number) => React.ReactNode;
  /** tailwind classes for header cell (width, alignment, etc.) */
  headClassName?: string;
  /** tailwind classes for body cell */
  className?: string;
  /** "left" | "center" | "right" (adds text-right/tabular-nums) */
  align?: "left" | "center" | "right";
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];

  /** Optional index column (S.NO) */
  showIndex?: boolean;
  indexHeader?: React.ReactNode; // default: "S.NO"
  startIndex?: number;           // default: 1
  indexColClassName?: string;    // default: "w-[80px] text-center"

  /** States */
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  errorContent?: React.ReactNode;

  /** Row key */
  getRowKey?: (row: T, rowIndex: number) => string;

  /** Styling toggles */
  stickyHeader?: boolean; // default: true
  zebra?: boolean;        // default: true
  hover?: boolean;        // default: true

  /** Class hooks */
  containerClassName?: string;
  tableClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
};

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
}: DataTableProps<T>) {
  const colCount = columns.length + (showIndex ? 1 : 0);

  const alignClass = (a: DataTableColumn<T>["align"]) =>
    a === "center" ? "text-center"
      : a === "right" ? "text-right tabular-nums"
        : "text-left";

  return (
    <div
      className={cn(
        "relative overflow-auto rounded-lg border border-border",
        containerClassName
      )}
    >
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
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className={cn(alignClass(c.align), c.headClassName)}
              >
                {c.header}
              </TableHead>
            ))}
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
              const key = getRowKey?.(row, i) ?? String(i);
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
                      className={cn(`px-3` + showIndex ? ' py-1' : ' py-3', alignClass(c.align), c.className)}
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
