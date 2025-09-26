import { useMemo, useState } from "react";
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
import { RefreshCw } from "lucide-react";
import Kpi from "@/components/common/Kpi";
import { AppIcons } from "@/lib/icon-map";
import type { DataTableColumn } from "@/components/common/data-table/types";
import DataTable from "@/components/common/DataTable";
import TypeBadge from "@/components/common/TypeBadge";
import type { EntityType } from "@/lib/types"

/** ------------ Types ------------ */
type Row = {
  name: string;
  id: string;
  type: EntityType;
  /** IST local time in "YYYY-MM-DD HH:mm:ss" or null */
  expiryDate: string | null;
};

type RowView = {
  name: string;
  id: string;
  type: EntityType;
  expiryDateFmt: string;
  expiresIn: number; // NaN allowed
};

/** ------------ Mock (mixed future/past) ------------ */
const MOCK: Row[] = [
  { name: "test Laboratories India Private Limited", id: "test-fip-10", type: "FIP", expiryDate: "2025-07-29 14:22:07" },
  { name: "AA-SIMULATOR-2", id: "AA-SIMULATOR-2", type: "AA", expiryDate: "2025-04-01 09:45:12" },
  { name: "FIP-SIMULATOR-29", id: "FIP-SIMULATOR-33", type: "FIP", expiryDate: "2025-10-12 18:05:33" },
  { name: "FIU-SIMULATOR", id: "afpl-FIU", type: "FIU", expiryDate: "2025-03-23 02:10:05" },
  { name: "FIP-BANK-HDFC", id: "HDFC-FIP-001", type: "FIP", expiryDate: "2025-08-15 16:30:00" },
  { name: "FIU-BANK-ICICI", id: "ICICI-FIU-001", type: "FIU", expiryDate: "2025-09-01 11:12:45" },
  { name: "AA-BANK-SBI", id: "SBI-AA-001", type: "AA", expiryDate: "2025-03-15 07:00:00" },
  { name: "FIU-KOTAK-BANK", id: "KOTAK-FIU-001", type: "FIU", expiryDate: "2025-08-30 23:59:59" },
  { name: "AA-FINVU", id: "FINVU-AA-001", type: "AA", expiryDate: "2025-02-28 12:00:00" },
  { name: "FIU-INDUSIND", id: "INDUSIND-FIU-001", type: "FIU", expiryDate: "2025-07-20 06:30:30" },
  { name: "AA-PERFIOS", id: "PERFIOS-AA-001", type: "AA", expiryDate: "2025-11-01 08:15:00" },
  { name: "FIP-BOI", id: "BOI-FIP-001", type: "FIP", expiryDate: "2025-06-30 20:45:05" },
  { name: "AA-ONEMONEY", id: "ONEMONEY-AA-001", type: "AA", expiryDate: "2025-09-15 13:10:10" },
];

export default function SecretExpiryDetails() {
  // filters
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");
  const [qType, setQType] = useState<"all" | EntityType>("all");
  const [fromDate, setFromDate] = useState<string>(""); // YYYY-MM-DD
  const [toDate, setToDate] = useState<string>("");     // YYYY-MM-DD

  const [isRefreshing, setIsRefreshing] = useState(false);

  // derived: filtered rows
  const filtered = useMemo(() => {
    const nq = qName.trim().toLowerCase();
    const iq = qId.trim().toLowerCase();

    return MOCK.filter((r) => {
      const byName = !nq || r.name.toLowerCase().includes(nq);
      const byId = !iq || r.id.toLowerCase().includes(iq);
      const byType = qType === "all" || r.type === qType;

      const byRange = (() => {
        if (!fromDate && !toDate) return true;
        if (!r.expiryDate) return false;

        // Parse the actual expiry moment in IST
        const expiry = parseISTLocalDateTime(r.expiryDate); // Date
        if (Number.isNaN(expiry.getTime())) return false;

        // Build inclusive range in IST
        const from = fromDate ? istMidnightStart(fromDate) : null;           // 00:00:00.000 IST
        const to = toDate ? istMidnightEnd(toDate) : null;                   // 23:59:59.999 IST

        if (from && expiry < from) return false;
        if (to && expiry > to) return false;
        return true;
      })();

      return byName && byId && byType && byRange;
    })
      .map((r) => ({
        ...r,
        expiresIn: r.expiryDate ? daysUntilIST(r.expiryDate) : Number.NaN,
        expiryDateFmt: r.expiryDate ? formatIST(r.expiryDate) : "Not Available",
      }));
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

  const cols: DataTableColumn<RowView>[] = useMemo(() => [
    { key: "name", header: "Entity Name", cell: r => r.name },
    { key: "id", header: "Entity ID", cell: r => <span className="font-mono text-sm">{r.id}</span> },
    { key: "type", header: "Type", headClassName: "w-[120px]", cell: r => <TypeBadge type={r.type} /> },
    { key: "exp", header: "Expiry Date (IST)", headClassName: "w-[200px]", cell: r => r.expiryDateFmt, sortValue: (r) => Number.isNaN(r.expiresIn) ? null : r.expiresIn, },
    {
      key: "in",
      header: "Expires In",
      headClassName: "w-[140px]",
      align: "right",
      cell: r =>
        Number.isNaN(r.expiresIn) ? (
          <span className="text-muted-foreground">N/A</span>
        ) : r.expiresIn < 0 ? (
          <span className="text-red-600">{r.expiresIn}</span>
        ) : r.expiresIn <= 10 ? (
          <span className="text-amber-600">{r.expiresIn}</span>
        ) : (
          <span className="text-emerald-600">{r.expiresIn}</span>
        ),
      sortValue: (r) => Number.isNaN(r.expiresIn) ? null : r.expiresIn,
    },
  ], []);

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

  return (
    <div className="">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-2xl font-semibold">IAM</h1>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <h2 className="text-base font-medium">Secret Expiry</h2>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <h3 className="text-base text-muted-foreground">Expiry Details</h3>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Filter entities by name/ID/type and date range, view IST expiry dates & days remaining, and export CSV.
        </p>
      </div>

      <div className="mx-auto max-w-7xl py-6">
        {/* KPI cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Already Expired" value={kpis.expired} tone="red" icon={<AppIcons.TriangleAlert className="h-9 w-9" />} />
          <Kpi title="Expiring ≤ 10 days" value={kpis.soon} tone="amber" icon={<AppIcons.CalendarClock className="h-9 w-9" />} />
          <Kpi title="Reset (last 24h)" value={kpis.reset24h} tone="sky" icon={<AppIcons.RefreshCcw className="h-9 w-9" />} />
          <Kpi title="Most Expired Type" value={kpis.mostExpiredType} tone="indigo" icon={<AppIcons.ShieldAlert className="h-9 w-9" />} />
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
          <DataTable<RowView>
            data={filtered}
            columns={cols}
            showIndex
            indexHeader="S.NO"
            emptyMessage="No records match your filters."
            getRowKey={(r) => r.id}
            exportCsvFilename="IAM_Secret_Expiry_Details.csv"
            initialSort={{ key: "name", direction: "asc" }}
          />
        </Card>
      </div>
    </div>
  );
}

/** ------------ IST helpers & utils ------------ */

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Parse "YYYY-MM-DD HH:mm:ss" as IST (+05:30). */
function parseISTLocalDateTime(s: string): Date {
  return new Date(`${s.replace(" ", "T")}+05:30`);
}

/** Build IST midnight start from a YYYY-MM-DD string. */
function istMidnightStart(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000+05:30`);
}

/** Build IST end-of-day from a YYYY-MM-DD string (inclusive). */
function istMidnightEnd(ymd: string): Date {
  return new Date(`${ymd}T23:59:59.999+05:30`);
}

/** Format a "YYYY-MM-DD HH:mm:ss" IST string → localized human string (IST). */
function formatIST(s: string): string {
  const d = parseISTLocalDateTime(s);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

/** Days until expiry, computed at IST midnight boundaries. */
function daysUntilIST(isoLocalIST: string): number {
  const expiry = parseISTLocalDateTime(isoLocalIST);

  // Today in IST
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istNow = new Date(utcMs + 330 * 60000);

  const todayY = istNow.getFullYear();
  const todayM = pad2(istNow.getMonth() + 1);
  const todayD = pad2(istNow.getDate());

  const startTodayIST = new Date(`${todayY}-${todayM}-${todayD}T00:00:00+05:30`);
  const expY = expiry.getFullYear();
  const expM = pad2(expiry.getMonth() + 1);
  const expD = pad2(expiry.getDate());
  const startExpiryIST = new Date(`${expY}-${expM}-${expD}T00:00:00+05:30`);

  return Math.ceil((startExpiryIST.getTime() - startTodayIST.getTime()) / 86400000);
}
