import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Kpi from "@/components/common/Kpi";
import EmptyState from "@/components/common/EmptyState";
import PageNumbers from "@/components/common/PageNumbers";
import { AppIcons } from "@/lib/icon-map";

/** ------------ Types ------------ */
type EntityType = "AA" | "FIP" | "FIU";

type Row = {
  name: string;
  id: string;
  type: EntityType;
  expiryDate: string | null; // ISO Date (YYYY-MM-DD) or null
};

/** ------------ Mock (mixed future/past) ------------ */
const MOCK: Row[] = [
  { name: "test Laboratories India Private Limited", id: "test-fip-10", type: "FIP", expiryDate: "2025-07-29" },
  { name: "AA-SIMULATOR-2", id: "AA-SIMULATOR-2", type: "AA", expiryDate: "2025-04-01" },
  { name: "FIP-SIMULATOR-29", id: "FIP-SIMULATOR-33", type: "FIP", expiryDate: "2025-10-12" },
  { name: "FIU-SIMULATOR", id: "afpl-FIU", type: "FIU", expiryDate: "2025-03-23" },
  { name: "FIP-BANK-HDFC", id: "HDFC-FIP-001", type: "FIP", expiryDate: "2025-08-15" },
  { name: "FIU-BANK-ICICI", id: "ICICI-FIU-001", type: "FIU", expiryDate: "2025-09-01" },
  { name: "AA-BANK-SBI", id: "SBI-AA-001", type: "AA", expiryDate: "2025-03-15" },
  { name: "FIU-KOTAK-BANK", id: "KOTAK-FIU-001", type: "FIU", expiryDate: "2025-08-30" },
  { name: "AA-FINVU", id: "FINVU-AA-001", type: "AA", expiryDate: "2025-02-28" },
  { name: "FIU-INDUSIND", id: "INDUSIND-FIU-001", type: "FIU", expiryDate: "2025-07-20" },
  { name: "AA-PERFIOS", id: "PERFIOS-AA-001", type: "AA", expiryDate: "2025-11-01" },
  { name: "FIP-BOI", id: "BOI-FIP-001", type: "FIP", expiryDate: "2025-06-30" },
  { name: "AA-ONEMONEY", id: "ONEMONEY-AA-001", type: "AA", expiryDate: "2025-09-15" },
];

export default function SecretExpiryDetails() {
  // filters
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");
  const [qType, setQType] = useState<"all" | EntityType>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // table paging
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // derived: filtered rows
  const filtered = useMemo(() => {
    const nq = qName.trim().toLowerCase();
    const iq = qId.trim().toLowerCase();

    return MOCK.filter((r) => {
      const byName = !nq || r.name.toLowerCase().includes(nq);
      const byId = !iq || r.id.toLowerCase().includes(iq);
      const byType = qType === "all" || r.type === qType;

      const byRange = ((): boolean => {
        if (!fromDate && !toDate) return true;
        if (!r.expiryDate) return false;
        const d = new Date(r.expiryDate);
        d.setHours(0, 0, 0, 0);
        if (fromDate) {
          const f = new Date(fromDate);
          f.setHours(0, 0, 0, 0);
          if (d < f) return false;
        }
        if (toDate) {
          const t = new Date(toDate);
          t.setHours(23, 59, 59, 999); // inclusive
          if (d > t) return false;
        }
        return true;
      })();

      return byName && byId && byType && byRange;
    })
      .map((r) => ({
        ...r,
        expiresIn: r.expiryDate ? daysUntil(r.expiryDate) : Number.NaN,
        expiryDateFmt: r.expiryDate ?? "Not Available",
      }))
      .sort((a, b) => {
        // Sort by "Expires In" ascending, pushing N/A to bottom
        const ax = Number.isNaN(a.expiresIn) ? Infinity : a.expiresIn;
        const bx = Number.isNaN(b.expiresIn) ? Infinity : b.expiresIn;
        return ax - bx;
      });
  }, [qName, qId, qType, fromDate, toDate]);

  // KPIs
  const kpis = useMemo(() => {
    const expired = filtered.filter((r) => !Number.isNaN(r.expiresIn) && r.expiresIn < 0).length;
    const soon = filtered.filter((r) => !Number.isNaN(r.expiresIn) && r.expiresIn >= 0 && r.expiresIn <= 10).length;
    const reset24h = Math.max(1, Math.min(5, Math.floor(filtered.length * 0.15))); // small mock heuristic
    const expiredByType: Record<EntityType, number> = { AA: 0, FIP: 0, FIU: 0 };
    filtered.forEach((r) => {
      if (!Number.isNaN(r.expiresIn) && r.expiresIn < 0) expiredByType[r.type] += 1;
    });
    const mostExpiredType = (Object.entries(expiredByType).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "FIP") as EntityType;
    return { expired, soon, reset24h, mostExpiredType };
  }, [filtered]);

  // pagination
  useEffect(() => setPage(1), [qName, qId, qType, fromDate, toDate, rowsPerPage]);
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIdx = (page - 1) * rowsPerPage;
  const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);
  const rangeStart = totalRows === 0 ? 0 : startIdx + 1;
  const rangeEnd = Math.min(startIdx + rowsPerPage, totalRows);

  // actions
  const reset = () => {
    setQName("");
    setQId("");
    setQType("all");
    setFromDate("");
    setToDate("");
  };
  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };
  const downloadCsv = () => {
    const header = ["S.NO", "Entity Name", "Entity ID", "Type", "Expiry Date", "Expires In"];
    const rows = filtered.map((r, i) => [
      String(i + 1),
      r.name,
      r.id,
      r.type,
      r.expiryDateFmt,
      Number.isNaN(r.expiresIn) ? "N/A" : String(r.expiresIn),
    ]);
    toCsvAndDownload([header, ...rows], "IAM_Secret_Expiry_Details.csv");
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl py-6">
        {/* KPI cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Already Expired" value={kpis.expired} tone="red" icon={<AppIcons.TriangleAlert className="h-8 w-8" />} />
          <Kpi title="Expiring ≤ 10 days" value={kpis.soon} tone="amber" icon={<AppIcons.CalendarClock className="h-8 w-8" />} />
          <Kpi title="Reset (last 24h)" value={kpis.reset24h} tone="sky" icon={<AppIcons.RefreshCcw className="h-8 w-8" />} />
          <Kpi title="Most Expired Type" value={kpis.mostExpiredType} tone="indigo" icon={<AppIcons.ShieldAlert className="h-8 w-8" />} />
        </div>

        <Card className="relative p-4 md:p-5">
          {/* Filters */}
          <div className="mb-4 grid gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                From date
              </label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                To date
              </label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Search by Entity Name
              </label>
              <Input placeholder="e.g. FIP-SIMULATOR" value={qName} onChange={(e) => setQName(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Search by Entity ID
              </label>
              <Input placeholder="e.g. HDFC-FIP-001" value={qId} onChange={(e) => setQId(e.target.value)} />
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">RE Type</label>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Select value={qType} onValueChange={(v) => setQType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="AA">AA</SelectItem>
                  <SelectItem value="FIP">FIP</SelectItem>
                  <SelectItem value="FIU">FIU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 flex gap-2 md:justify-end">
              <Button variant="outline" onClick={reset}>Reset</Button>
              <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="relative overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 backdrop-blur bg-background/80">
                <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium [&>th]:text-left border-b border-border">
                  <th className="w-[80px] text-center">S.NO</th>
                  <th>Entity Name</th>
                  <th>Entity ID</th>
                  <th className="w-[120px]">Type</th>
                  <th className="w-[160px]">Expiry Date</th>
                  <th className="w-[140px] text-right">Expires In</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                {pageRows.map((r, i) => (
                  <tr key={`${r.id}-${i}`} className="odd:bg-muted/40 hover:bg-accent transition-colors">
                    <td className="px-3 py-3 text-center tabular-nums">{startIdx + i + 1}</td>
                    <td className="px-3 py-3">{r.name}</td>
                    <td className="px-3 py-3 font-mono text-sm">{r.id}</td>
                    <td className="px-3 py-3"><TypeBadge type={r.type} /></td>
                    <td className="px-3 py-3">{r.expiryDateFmt}</td>
                    <td className="px-3 py-3 pr-4 text-right tabular-nums font-medium">
                      {Number.isNaN(r.expiresIn) ? (
                        <span className="text-muted-foreground">N/A</span>
                      ) : r.expiresIn < 0 ? (
                        <span className="text-red-600">{r.expiresIn}</span>
                      ) : r.expiresIn <= 10 ? (
                        <span className="text-amber-600">{r.expiresIn}</span>
                      ) : (
                        <span className="text-emerald-600">{r.expiresIn}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center">
                      <EmptyState message="No records match your filters" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={downloadCsv}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="text-xs text-muted-foreground">
                Rows {rangeStart}-{rangeEnd} of {totalRows}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
                  <SelectTrigger className="h-8 w-[84px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
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
          </div>
        </Card>
      </div>
    </div>
  );
}

/** ------------ UI bits (match CR pages) ------------ */
function TypeBadge({ type }: { type: EntityType }) {
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

/** ------------ utils ------------ */
function daysUntil(isoDate: string): number {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return Number.NaN;
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function toCsvAndDownload(matrix: (string | number)[][], filename: string) {
  const csv = matrix.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(s: string | number) {
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
