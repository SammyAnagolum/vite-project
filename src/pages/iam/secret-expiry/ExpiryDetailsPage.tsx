// src/pages/iam/SecretExpiryDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { HelpCircle, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Kpi from "@/components/common/Kpi";
import { AppIcons } from "@/lib/icon-map";
import type { DataTableColumn } from "@/components/common/data-table/types";
import DataTable from "@/components/common/DataTable";
import TypeBadge from "@/components/common/TypeBadge";
import type { EntityType, FilterType } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchSecretExpiry, type SecretExpiryItem } from "@/services/iamApi";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/http";
import { exportedAtIST, ymd, istStartOfDay, istEndOfDay, parseIstString, daysUntilIst } from "@/lib/datetime";

/** ------------ Page-local view types ------------ */
type RowView = {
  name: string;
  id: string;
  type: EntityType;
  expiryDateFmt: string;       // "YYYY-MM-DD HH:mm:ss" or "Not Available"
  expiresIn: number;           // NaN if not available
};

export default function SecretExpiryDetails() {
  // server state
  const [rows, setRows] = useState<SecretExpiryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [nameQuery, setNameQuery] = useState("");
  const [idQuery, setIdQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [fromDate, setFromDate] = useState<string>(""); // YYYY-MM-DD
  const [toDate, setToDate] = useState<string>("");     // YYYY-MM-DD
  // include/exclude rows that have no expiry (N/A)
  const [includeNAExpiry, setIncludeNAExpiry] = useState<boolean>(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Focus mode (hide header/KPIs; keep toggle visible)
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // initial fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setErr(null);
        const data = await fetchSecretExpiry(false);
        if (!mounted) return;
        setRows(dedupeById(data));
      } catch (e) {
        if (!mounted) return;
        setErr(extractErrorMessage(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const refetch = async (forceRefresh = false) => {
    try {
      setIsRefreshing(true);
      const data = await fetchSecretExpiry(forceRefresh);
      setRows(dedupeById(data));
      toast.success(forceRefresh ? "Expiry data refreshed (force)" : "Expiry data refreshed");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setIsRefreshing(false);
    }
  };

  // derived: filtered + formatted
  const filtered: RowView[] = useMemo(() => {
    const nq = nameQuery.trim().toLowerCase();
    const iq = idQuery.trim().toLowerCase();

    return rows
      .filter((r) => {
        const byName = !nq || r.name.toLowerCase().includes(nq);
        const byId = !iq || r.id.toLowerCase().includes(iq);
        const byType = typeFilter === "all" || r.type === typeFilter;

        // Date range (IST) on the expiryAt field
        const byRange = (() => {
          if (!fromDate && !toDate) return true;
          if (!r.expiryAt) return false;

          const expiry = parseIstString(r.expiryAt);
          if (!expiry) return false;

          const from = fromDate ? istStartOfDay(fromDate) : null;
          const to = toDate ? istEndOfDay(toDate) : null;

          if (from && expiry < from) return false;
          if (to && expiry > to) return false;
          return true;
        })();

        // Include N/A expiry rows only if toggle is ON
        const byNA = includeNAExpiry || !!r.expiryAt;
        return byName && byId && byType && byRange && byNA;
      })
      .map((r) => ({
        name: r.name,
        id: r.id,
        type: r.type,
        expiryDateFmt: r.expiryAt ? r.expiryAt : "Not Available",
        expiresIn: r.expiryAt ? daysUntilIst(r.expiryAt) : Number.NaN,
      }));
  }, [rows, nameQuery, idQuery, typeFilter, fromDate, toDate, includeNAExpiry]);

  // -------- Export preamble (shows up at top of the Excel file) --------
  const exportInfo = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    if (fromDate) items.push({ label: "From date (IST)", value: fromDate });
    if (toDate) items.push({ label: "To date (IST)", value: toDate });
    if (nameQuery.trim()) items.push({ label: "Name contains", value: nameQuery.trim() });
    if (idQuery.trim()) items.push({ label: "Entity ID contains", value: idQuery.trim() });
    items.push({ label: "Type", value: typeFilter === "all" ? "All" : typeFilter });
    items.push({ label: "Include N/A expiry", value: includeNAExpiry ? "Yes" : "No" });
    items.push({ label: "Rows (filtered)", value: String(filtered.length) });
    items.push({
      label: "Exported At (IST)",
      value: exportedAtIST(),
    });
    return items;
  }, [fromDate, toDate, nameQuery, idQuery, typeFilter, includeNAExpiry, filtered.length]);

  // KPIs
  const kpis = useMemo(() => {
    const expired = filtered.filter((r) => !Number.isNaN(r.expiresIn) && r.expiresIn < 0).length;
    const today = filtered.filter((r) => !Number.isNaN(r.expiresIn) && r.expiresIn >= 0 && r.expiresIn < 1).length;
    const soon = filtered.filter((r) => !Number.isNaN(r.expiresIn) && r.expiresIn >= 0 && r.expiresIn <= 10).length;
    const expiredByType: Record<EntityType, number> = { AA: 0, FIP: 0, FIU: 0 };
    filtered.forEach((r) => {
      if (!Number.isNaN(r.expiresIn) && r.expiresIn < 0) expiredByType[r.type] += 1;
    });
    const mostExpiredType = (Object.entries(expiredByType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "FIP") as EntityType;
    return { expired, today, soon, mostExpiredType };
  }, [filtered]);

  const cols: DataTableColumn<RowView>[] = useMemo(() => [
    { key: "name", header: "Entity Name", cell: r => r.name },
    { key: "id", header: "Entity ID", cell: r => <span className="font-mono text-sm">{r.id}</span> },
    { key: "type", header: "Type", headClassName: "w-[120px]", cell: r => <TypeBadge type={r.type} /> },
    {
      key: "exp",
      header: "Expiry Date (IST)",
      headClassName: "w-[200px]",
      cell: r => r.expiryDateFmt,
      sortValue: (r) => Number.isNaN(r.expiresIn) ? null : r.expiresIn,
    },
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
      sortBy: "expiresIn",
      sortValue: (r) => Number.isNaN(r.expiresIn) ? null : r.expiresIn,
    },
  ], []);

  // actions
  const reset = () => {
    setNameQuery("");
    setIdQuery("");
    setTypeFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {!focusMode && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-2xl font-semibold">IAM</h1>
          <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
          <h2 className="text-base font-medium">Secret Expiry</h2>
          <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            <h3 className="text-base text-muted-foreground">Expiry Details</h3>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground cursor-help"
                    aria-label="About this page"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  Filter entities by name/ID/type and date range, view IST expiry dates & days remaining, and export XLSX/CSV.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="h-full min-h-0 py-4 flex flex-col">
        {/* KPI cards */}
        {!focusMode && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Already Expired" value={kpis.expired} tone="red" icon={<AppIcons.TriangleAlert className="h-9 w-9" />} />
            <Kpi title="Expiring Today" value={kpis.today} tone="amber" icon={<AppIcons.CalendarDays className="h-9 w-9" />} />
            <Kpi title="Expiring in ≤ 10 days" value={kpis.soon} tone="sky" icon={<AppIcons.CalendarClock className="h-9 w-9" />} />
            <Kpi title="Most Expired Type" value={kpis.mostExpiredType} tone="indigo" icon={<AppIcons.ShieldAlert className="h-9 w-9" />} />
          </div>
        )}

        <Card className="relative p-4 md:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Focus toggle – always visible */}
          <div className="absolute right-1 top-1 z-20">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-pressed={focusMode}
                    aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
                    onClick={() => setFocusMode(v => !v)}
                  >
                    {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    <span className="sr-only">{focusMode ? "Exit focus mode" : "Enter focus mode"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{focusMode ? "Exit focus" : "Focus (hide headers)"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Filters */}
          <div className="mb-4 grid gap-3 md:grid-cols-16 md:items-end">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From date</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To date</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Search by Entity Name</label>
              <Input placeholder="e.g. FIP-SIMULATOR" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Search by Entity ID</label>
              <Input placeholder="e.g. HDFC-FIP-001" value={idQuery} onChange={(e) => setIdQuery(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">RE Type</label>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
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
            <div className="md:col-span-2 mb-1">
              {/* Include/Exclude N/A expiry toggle (with tooltip) */}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group flex items-center gap-2 mr-auto cursor-help">
                      <Switch id="toggle-na-expiry" checked={includeNAExpiry} onCheckedChange={setIncludeNAExpiry} />
                      <Label htmlFor="toggle-na-expiry" className="text-sm text-muted-foreground">
                        No expiry
                      </Label>
                      <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    Include rows with no expiry date (N/A). Turn off to hide them.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="md:col-span-3 flex gap-2 md:justify-end">
              <Button variant="outline" onClick={reset}>Reset</Button>
              <Button
                variant="outline"
                onClick={() => refetch(true)}
                disabled={isRefreshing || loading}
                title="Force refresh from source"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <DataTable<RowView>
            data={filtered}
            columns={cols}
            className="flex-1 min-h-0 w-full"
            containerClassName="flex-1 min-h-0 w-full"
            showIndex
            indexHeader="S.NO"
            loading={loading}
            error={err}
            emptyMessage="No records match your filters."
            getRowKey={(r) => r.id}
            exportCsvFilename={`IAM_Secret_Expiry_Details_Downloaded-Date-${ymd()}.csv`}
            exportExcelFilename={`IAM_Secret_Expiry_Details_Downloaded-Date-${ymd()}.xlsx`}
            exportInfo={exportInfo}
            initialSort={{ key: "name", direction: "asc" }}
          />
        </Card>
      </div>
    </div>
  );
}

/** De-dupe by entity id (keep last occurrence). */
function dedupeById(items: SecretExpiryItem[]): SecretExpiryItem[] {
  const map = new Map<string, SecretExpiryItem>();
  items.forEach(i => map.set(i.id, i));
  return Array.from(map.values());
}