// src/pages/cr/TelemetryPage.tsx
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
import EmptyState from "@/components/common/EmptyState";
import { AppIcons } from "@/lib/icon-map";
import type { DataTableColumn } from "@/components/common/data-table/types";
import DataTable from "@/components/common/DataTable";
import TypeBadge from "@/components/common/TypeBadge";
import type { EntityType } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  fetchAllEntities,
  type EntityListItem,
  fetchCRTelemetry,
  computeLastByEntity,
  type CrTelemetryRow,
} from "@/services/crApi";
import { extractErrorMessage } from "@/lib/http";

type RowMain = {
  name: string;
  entity_id: string;
  type: EntityType;
  recent_fetch_time: string | "-";
  call_count: number; // for selected date
};

export default function TelemetryPage() {
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");
  const [qType, setQType] = useState<"all" | EntityType>("all");
  const [dateStr, setDateStr] = useState<string>(toISODate(new Date())); // default today
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  // include / exclude rows with missing recent fetch time ("-")
  const [includeNARecent, setIncludeNARecent] = useState<boolean>(true);

  const [entities, setEntities] = useState<EntityListItem[]>([]);
  const [telemetry, setTelemetry] = useState<CrTelemetryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setErr(null);
        const [elist, trows] = await Promise.all([fetchAllEntities(), fetchCRTelemetry()]);
        if (!mounted) return;
        setEntities(elist);
        setTelemetry(trows);
      } catch (e) {
        if (!mounted) return;
        setErr(extractErrorMessage(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function refresh() {
    try {
      setIsRefreshing(true);
      const [elist, trows] = await Promise.all([fetchAllEntities(), fetchCRTelemetry()]);
      setEntities(elist);
      setTelemetry(trows);
      toast.success("Telemetry refreshed");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setIsRefreshing(false);
    }
  }

  // join entities + telemetry → table rows for selected date
  const rowsMain: RowMain[] = useMemo(() => {
    // Only include entities that exist in fetchAllEntities(); seed base with those
    const lastByEntity = computeLastByEntity(telemetry);
    const base = new Map<string, RowMain>();
    entities.forEach((e) => {
      base.set(e.id, {
        name: e.name,
        entity_id: e.id,
        type: e.type,
        recent_fetch_time: lastByEntity[e.id] ?? "-",
        call_count: 0,
      });
    });

    // apply selected date counts
    telemetry.forEach(ev => {
      if (!ev.entity_id) return;
      if (!base.has(ev.entity_id)) return;           // skip telemetry-only rows
      if (dateStr && ev.date !== dateStr) return;    // date filter: do not merge if the dates don't match
      const row = base.get(ev.entity_id)!;

      // overwrite count and recent fetch data using telemetry
      row.call_count += ev.call_count;
      row.recent_fetch_time = [row.recent_fetch_time, ev.last_fetch_time]
        .filter((s): s is string => !!s && s !== "-") // Remove empty times
        .sort((a, b) => Date.parse(a.replace(" ", "T")) - Date.parse(b.replace(" ", "T"))) // Sort ascending
        .pop() // Get last element (most recent time)
        ?? row.recent_fetch_time; // Default to cr response if both are empty
    });

    // filtering
    let out = Array.from(base.values());
    const nq = qName.trim().toLowerCase();
    const iq = qId.trim().toLowerCase();
    out = out.filter((r) => {
      const byName = !nq || r.name.toLowerCase().includes(nq);
      const byId = !iq || r.entity_id.toLowerCase().includes(iq);
      const byType = qType === "all" || r.type === qType;
      const byNA = includeNARecent || r.recent_fetch_time !== "-";
      return byName && byId && byType && byNA;
    });

    return out;
  }, [entities, telemetry, dateStr, qName, qId, qType, includeNARecent]);

  // KPIs
  const kpis = useMemo(() => {
    const total = rowsMain.reduce((sum, r) => sum + r.call_count, 0);
    const activeByType = { AA: 0, FIP: 0, FIU: 0 } as Record<EntityType, number>;
    rowsMain.forEach((r) => { if (r.call_count > 0) activeByType[r.type] += 1; });
    return { total, activeAA: activeByType.AA, activeFIP: activeByType.FIP, activeFIU: activeByType.FIU };
  }, [rowsMain]);

  // Excel preamble (filters + meta)
  const exportInfo = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    items.push({ label: "Date", value: dateStr || "All" });
    if (qName.trim()) items.push({ label: "Name contains", value: qName.trim() });
    if (qId.trim()) items.push({ label: "Entity ID contains", value: qId.trim() });
    items.push({ label: "Type", value: qType === "all" ? "All" : qType });
    items.push({ label: "Include N/A recent fetch", value: includeNARecent ? "Yes" : "No" });
    items.push({ label: "Rows (filtered)", value: String(rowsMain.length) });
    items.push({
      label: "Exported At",
      value: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(new Date()),
    });
    return items;
  }, [dateStr, qName, qId, qType, includeNARecent, rowsMain.length]);

  // table columns
  const mainCols: DataTableColumn<RowMain>[] = useMemo(() => [
    {
      key: "name",
      header: "Entity Name",
      cell: (r) => <span className="font-medium">{r.name}</span>,
      sortBy: "name"
    },
    {
      key: "id",
      header: "Entity ID",
      cell: (r) => <span className="font-mono text-sm">{r.entity_id}</span>,
      sortBy: "entity_id"
    },
    {
      key: "type",
      header: "Type",
      headClassName: "w-[120px]",
      cell: (r) => <TypeBadge type={r.type} />,
      sortBy: "type"
    },
    {
      key: "recent",
      header: "Recent Fetch Date",
      headClassName: "w-[180px]",
      cell: (r) => r.recent_fetch_time,
      sortValue: (r) => Number.isNaN(r.recent_fetch_time) ? null : r.recent_fetch_time,
    },
    {
      key: "count",
      header: "Fetch Count",
      headClassName: "w-[140px]",
      align: "right",
      cell: (r) => r.call_count.toLocaleString(),
      sortBy: "call_count"
    },
  ], []);

  const resetFilters = () => {
    setQName("");
    setQId("");
    setQType("all");
    setDateStr(toISODate(new Date()));
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {!focusMode && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-2xl font-semibold">Central Registry</h1>
          <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-medium">Telemetry</h2>
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
                  Track entity fetch activity by date; filter by name/ID/type, and export XLSX/CSV.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="h-full min-h-0 py-4 flex flex-col">
        {!focusMode && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Total Calls (filtered date)" value={kpis.total.toLocaleString()} icon={<AppIcons.Activity className="h-9 w-9" />} />
            <Kpi title="AA active" value={kpis.activeAA.toLocaleString()} tone="indigo" icon={<AppIcons.AA className="h-9 w-9" />} />
            <Kpi title="FIP active" value={kpis.activeFIP.toLocaleString()} tone="sky" icon={<AppIcons.FIP className="h-9 w-9" />} />
            <Kpi title="FIU active" value={kpis.activeFIU.toLocaleString()} tone="emerald" icon={<AppIcons.FIU className="h-9 w-9" />} />
          </div>
        )}

        <Card className="relative p-4 md:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Focus toggle */}
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
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:w-56">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                For a specific date
              </label>
              <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Search by Entity Name
              </label>
              <Input
                placeholder="e.g. FIP-SIMULATOR"
                value={qName}
                onChange={(e) => setQName(e.target.value)}
              />
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Search by Entity ID
              </label>
              <Input
                placeholder="e.g. FIP-SIMULATOR-33"
                value={qId}
                onChange={(e) => setQId(e.target.value)}
              />
            </div>

            <div className="w-full md:w-56">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">RE Type</label>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Select value={qType} onValueChange={(v) => setQType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="AA">AA</SelectItem>
                  <SelectItem value="FIP">FIP</SelectItem>
                  <SelectItem value="FIU">FIU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center py-2 gap-2 md:ml-2 cursor-help group">
                    <Switch id="toggle-na-recent" checked={includeNARecent} onCheckedChange={setIncludeNARecent} />
                    <Label htmlFor="toggle-na-recent" className="text-sm text-muted-foreground">
                      N/A
                    </Label>
                    <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  Include entities with no recent fetch time (shown as “-”). Turn off to hide them.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex gap-2 md:ml-auto">
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button variant="outline" onClick={refresh} disabled={isRefreshing || loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <DataTable<RowMain>
            data={rowsMain}
            columns={mainCols}
            className="flex-1 min-h-0 w-full"
            containerClassName="flex-1 min-h-0 w-full"
            showIndex
            indexHeader="S.NO"
            loading={loading}
            error={err}
            emptyContent={<EmptyState message="No records match your filters." />}
            getRowKey={(r) => r.entity_id}
            exportCsvFilename={`CR_Telemetry_Downloaded-Date-${new Date().toISOString().slice(0, 10)}.csv`}
            exportExcelFilename={`CR_Telemetry_Downloaded-Date-${new Date().toISOString().slice(0, 10)}.xlsx`}
            exportInfo={exportInfo}
          />
        </Card>
      </div>
    </div>
  );
}

/** utils */
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

