// src/pages/iam/RefreshRatePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar, Search, RefreshCcw, TrendingUp, Activity, Clock, BarChart3,
  ArrowLeft, HelpCircle, Minimize2, Maximize2,
  XCircle,
  PieChart,
} from "lucide-react";
import Kpi from "@/components/common/Kpi";
import EmptyState from "@/components/common/EmptyState";
import type { DataTableColumn } from "@/components/common/data-table/types";
import DataTable from "@/components/common/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/http";
import { fetchTokenData, type TokenTelemetryRow } from "@/services/iamApi";
import { fetchAllEntities, type EntityListItem } from "@/services/crApi";

/** ---------------- Types (UI shapes) ---------------- */
type DetailRow = {
  date: string;              // YYYY-MM-DD
  tokens_issued: number;
  tokens_not_issued: number;
  tokens_total: number;
};

type EntityRow = {
  entity_name: string;
  entity_id: string;
  recent_timestamp: string | "-"; // latest known token time across the window
  details: DetailRow[];           // per-day details from API
};

const EMPTY_DETAILS: DetailRow[] = [];

/** ---------------- Page ---------------- */
export default function RefreshRate() {
  // filters
  const [selectedDate, setSelectedDate] = useState<string>(() => todayISO());
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");

  // data state
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // detail view toggle
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Focus mode (hide header/KPIs; keep toggle visible)
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // initial fetch
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [tokenRows, crRows] = await Promise.all([fetchTokenData(), fetchAllEntities()]);
        if (!ok) return;
        setEntities(buildMergedEntities(tokenRows, crRows));
      } catch (e) {
        if (!ok) return;
        setErr(extractErrorMessage(e));
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      const [tokenRows, crRows] = await Promise.all([fetchTokenData(), fetchAllEntities()]);
      setEntities(buildMergedEntities(tokenRows, crRows));
      toast.success("Token data refreshed");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Aggregate for the main table by selected date
  type AggregatedRow = {
    entity_name: string;
    entity_id: string;
    recent_timestamp: string | "-";
    tokens_issued: number;
    tokens_not_issued: number;
    tokens_total: number;
  };

  const aggregated = useMemo<AggregatedRow[]>(() => {
    const nameQ = qName.trim().toLowerCase();
    const idQ = qId.trim().toLowerCase();

    return entities
      .map((e) => {
        const day = e.details.find((d) => d.date === selectedDate);
        const issued = day?.tokens_issued ?? 0;
        const notIssued = day?.tokens_not_issued ?? 0;
        const total = day?.tokens_total ?? 0;
        return {
          entity_name: e.entity_name,
          entity_id: e.entity_id,
          recent_timestamp: e.recent_timestamp,
          tokens_issued: issued,
          tokens_not_issued: notIssued,
          tokens_total: total,
        };
      })
      .filter((row) => {
        const hitName = !nameQ || row.entity_name.toLowerCase().includes(nameQ);
        const hitId = !idQ || row.entity_id.toLowerCase().includes(idQ);
        return hitName && hitId;
      });
  }, [entities, selectedDate, qName, qId]);

  // -------- Export preamble for MAIN table (appears at top of Excel) --------
  const exportInfoMain = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    items.push({ label: "Date", value: selectedDate });
    if (qName.trim()) items.push({ label: "Name contains", value: qName.trim() });
    if (qId.trim()) items.push({ label: "Entity ID contains", value: qId.trim() });
    items.push({ label: "Rows (filtered)", value: String(aggregated.length) });
    items.push({
      label: "Exported At (IST)",
      value: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" }).format(new Date()),
    });
    return items;
  }, [selectedDate, qName, qId, aggregated.length]);

  // KPIs
  const kpis = useMemo(() => {
    const highVolume = aggregated.filter((r) => r.tokens_total > 5).length;
    const totalIssued = aggregated.reduce((s, r) => s + r.tokens_issued, 0);
    const totalNotIssued = aggregated.reduce((s, r) => s + r.tokens_not_issued, 0);
    const totalTokens = aggregated.reduce((s, r) => s + r.tokens_total, 0);
    const avgIssuedPerEntity = aggregated.length ? Math.round(totalIssued / aggregated.length) : 0;
    const avgNotIssuedPerEntity = aggregated.length ? Math.round(totalNotIssued / aggregated.length) : 0;
    const avgTotalPerEntity = aggregated.length ? Math.round(totalTokens / aggregated.length) : 0;

    const inactive24h = entities.filter((e) => {
      const last = e.recent_timestamp !== "-" ? e.recent_timestamp : "";
      if (!last) return true;
      const lastDate = new Date(last.replace(" ", "T"));
      const sel = new Date(`${selectedDate}T00:00:00`);
      const diffHrs = Math.abs(+sel - +lastDate) / 36e5;
      return diffHrs > 24;
    }).length;

    return { highVolume, inactive24h, totalIssued, totalNotIssued, totalTokens, avgIssuedPerEntity, avgNotIssuedPerEntity, avgTotalPerEntity }
  }, [aggregated, entities, selectedDate]);

  // columns
  const mainCols: DataTableColumn<AggregatedRow>[] = useMemo(() => [
    {
      key: "name",
      header: "Entity Name",
      cell: (r) => (
        <button
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => setSelectedEntityId(r.entity_id)}
        >
          {r.entity_name}
        </button>
      ),
      sortBy: "entity_name"
    },
    {
      key: "id",
      header: "Entity ID",
      cell: (r) => <span className="font-mono text-sm">{r.entity_id}</span>,
      sortBy: "entity_id"
    },
    {
      key: "ts",
      header: "Last Token Issued Timestamp",
      headClassName: "w-[220px]",
      cell: (r) => r.recent_timestamp,
      exportValue: (r) => r.recent_timestamp,
      sortValue: (r) => Number.isNaN(r.recent_timestamp) ? null : r.recent_timestamp,
    },
    {
      key: "issued",
      header: "Issued",
      headClassName: "w-[140px]",
      align: "right",
      cell: (r) => r.tokens_issued,
      sortBy: "tokens_issued"
    },
    {
      key: "not",
      header: "Not Issued",
      headClassName: "w-[160px]",
      align: "right",
      cell: (r) => r.tokens_not_issued,
      sortBy: "tokens_not_issued"
    },
    {
      key: "total",
      header: "Total",
      headClassName: "w-[120px]",
      align: "right",
      cell: (r) => <span className="font-medium">{r.tokens_total}</span>,
      sortBy: "tokens_total"
    },
  ], []);

  const detailCols: DataTableColumn<DetailRow>[] = [
    { key: "date", header: "Date", sortBy: "date", cell: (r) => r.date },
    { key: "i", header: "Tokens Issued", headClassName: "w-[160px]", align: "right", sortBy: "tokens_issued", cell: (r) => r.tokens_issued },
    { key: "ni", header: "Tokens Not Issued", headClassName: "w-[180px]", align: "right", sortBy: "tokens_not_issued", cell: (r) => r.tokens_not_issued },
    { key: "t", header: "Total", headClassName: "w-[140px]", align: "right", sortBy: "tokens_total", cell: (r) => <span className="font-medium">{r.tokens_total}</span> },
  ];

  const resetFilters = () => {
    setSelectedDate(todayISO());
    setQName("");
    setQId("");
  };

  const selectedEntity = useMemo(
    () => entities.find((e) => e.entity_id === selectedEntityId) || null,
    [entities, selectedEntityId]
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      {!focusMode && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-2xl font-semibold">IAM</h1>
          <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
          <h2 className="text-base font-medium">Entity Tokens</h2>
          <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            <h3 className="text-base text-muted-foreground">Refresh Rate</h3>
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
                <TooltipContent side="bottom" align="start" className="">
                  Pick a date, see per-entity token activity, drill into daily counts, filter by name/ID, and export XLSX/CSV.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="h-full min-h-0 py-4 flex flex-col">
        {/* KPIs */}
        {!selectedEntity && !focusMode && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={<TrendingUp className="h-9 w-9" />} title="High Volume (>5)" value={kpis.highVolume} tone="emerald" />
            <Kpi icon={<Clock className="h-9 w-9" />} title="Inactive (24h+)" value={kpis.inactive24h} tone="amber" />
            <Kpi icon={<BarChart3 className="h-9 w-9" />} title="Total Tokens Issued" value={kpis.totalIssued} tone="indigo" />
            <Kpi icon={<Activity className="h-9 w-9" />} title="Avg Tokens Issued/Entity" value={kpis.avgIssuedPerEntity} tone="sky" />
            <Kpi icon={<XCircle className="h-9 w-9" />} title="Total Tokens Not Issued" value={kpis.totalNotIssued} tone="red" />
            <Kpi icon={<Activity className="h-9 w-9" />} title="Avg Tokens Not Issued/Entity" value={kpis.avgNotIssuedPerEntity} tone="amber" />
            <Kpi icon={<PieChart className="h-9 w-9" />} title="Total Tokens" value={kpis.totalTokens} tone="indigo" />
            <Kpi icon={<Activity className="h-9 w-9" />} title="Avg Token Total/Entity" value={kpis.avgTotalPerEntity} tone="sky" />
          </div>
        )}

        <Card className="relative p-4 md:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Focus toggle – always visible */}
          <div className={"absolute right-1 top-1 z-20"}>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 not-hover:text-muted-foreground"
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

          {/* Filters / Header row */}
          {!selectedEntity ? (
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full md:w-56">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">For a specific past date</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Search by Entity Name</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. HDFC-FIP"
                    value={qName}
                    onChange={(e) => setQName(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Search by Entity ID
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. HDFC-FIP-001"
                    value={qId}
                    onChange={(e) => setQId(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex gap-2 md:ml-auto">
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="outline" onClick={onRefresh} disabled={isRefreshing || loading}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {isRefreshing ? "Refreshing…" : "Refresh"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-3">
              <Button variant="outline" onClick={() => setSelectedEntityId(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="text-sm text-muted-foreground">Entity:</div>
              <div className="font-medium">{selectedEntity?.entity_name}</div>
              <div className="text-xs text-muted-foreground">({selectedEntity?.entity_id})</div>
            </div>
          )}

          {/* Table(s) */}
          {!selectedEntity ? (
            <DataTable<AggregatedRow>
              data={aggregated}
              columns={mainCols}
              className="flex-1 min-h-0 w-full"
              containerClassName="flex-1 min-h-0 w-full"
              showIndex
              indexHeader="S.NO"
              startIndex={1}
              emptyContent={<EmptyState message={loading ? "Loading…" : "No entities for the selected filters."} />}
              getRowKey={(r) => r.entity_id}
              exportCsvFilename={`IAM_EntityTokens_RefreshRate_${selectedDate}.csv`}
              exportExcelFilename={`IAM_EntityTokens_RefreshRate_${selectedDate}.xlsx`}
              exportInfo={exportInfoMain}
              initialSort={{ key: "name", direction: "asc" }}
              loading={loading}
              error={err}
            />
          ) : (
            <EntityDetailCard entity={selectedEntity} detailCols={detailCols} />
          )}
        </Card>
      </div>
    </div>
  );
}

/** ---------------- Detail View ---------------- */
function EntityDetailCard({
  entity,
  detailCols,
}: {
  entity: EntityRow | null;
  detailCols: DataTableColumn<DetailRow>[];
}) {
  const details: DetailRow[] = entity?.details ?? EMPTY_DETAILS;

  const totals = useMemo(
    () =>
      details.reduce(
        (acc, d) => {
          acc.issued += d.tokens_issued;
          acc.notIssued += d.tokens_not_issued;
          acc.total += d.tokens_total;
          return acc;
        },
        { issued: 0, notIssued: 0, total: 0 }
      ),
    [details]
  );

  const exportInfoDetail = useMemo(() => {
    if (!entity) return [];
    return [
      { label: "Entity", value: `${entity.entity_name} (${entity.entity_id})` },
      { label: "Rows", value: String(details.length) },
      {
        label: "Exported At (IST)",
        value: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" }).format(new Date()),
      },
    ];
  }, [entity, details.length]);

  if (!entity) return null;

  return (
    <>
      {/* Entity KPIs */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MiniKpi label="Issued" value={totals.issued} />
        <MiniKpi label="Not Issued" value={totals.notIssued} />
        <MiniKpi label="Total" value={totals.total} />
      </div>

      <DataTable<DetailRow>
        data={details}
        columns={detailCols}
        className="flex-1 min-h-0 w-full"
        containerClassName="flex-1 min-h-0 w-full"
        showIndex
        indexHeader="S.NO"
        startIndex={1}
        emptyContent={<EmptyState message="No token activity for this entity." />}
        getRowKey={(r) => `${entity.entity_id}-${r.date}`}
        paginate={false}
        exportCsvFilename={`IAM_EntityTokens_${entity.entity_id}_Detail.csv`}
        exportExcelFilename={`IAM_EntityTokens_${entity.entity_id}_Detail.csv`}
        exportInfo={exportInfoDetail}
        initialSort={{ key: "date", direction: "desc" }}
      />
    </>
  );
}

/** ---------------- Reusable bits ---------------- */
function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** ---------------- Helpers ---------------- */
function buildMergedEntities(tokenRows: TokenTelemetryRow[], crRows: EntityListItem[]): EntityRow[] {
  // Canonical CR map (id -> { id, name })
  const crMap = new Map(crRows.map((e) => [e.id, e]));

  // Group token data by entity id -> {details map, max last_token_time}
  const byEntity = new Map<
    string,
    {
      details: Map<string, DetailRow>;
      last: string | null;
      nameFromTokens: string;
    }
  >();

  for (const r of tokenRows) {
    if (!crMap.has(r.entity_id)) continue; // keep only CR-listed entities

    const bucket =
      byEntity.get(r.entity_id) ??
      {
        details: new Map<string, DetailRow>(),
        last: null,
        nameFromTokens: r.entity_name,
      };

    // track max last_token_time
    if (r.last_token_time) {
      const cur = bucket.last ? new Date(bucket.last).getTime() : -Infinity;
      const next = new Date(r.last_token_time).getTime();
      if (Number.isFinite(next) && next > cur) bucket.last = r.last_token_time;
    }

    // aggregate per day
    const d = bucket.details.get(r.date) ?? { date: r.date, tokens_issued: 0, tokens_not_issued: 0, tokens_total: 0 };
    d.tokens_issued += r.tokens_issued;
    d.tokens_not_issued += r.tokens_not_issued;
    d.tokens_total += r.tokens_issued + r.tokens_not_issued;
    bucket.details.set(r.date, d);

    byEntity.set(r.entity_id, bucket);
  }

  // Build final rows for ALL CR entities (zero rows for those without tokens)
  const rows: EntityRow[] = [];
  for (const e of crRows) {
    const bucket = byEntity.get(e.id);
    const details = bucket ? Array.from(bucket.details.values()).sort((a, b) => (a.date < b.date ? 1 : -1)) : [];
    rows.push({
      entity_id: e.id,
      entity_name: e.name ?? bucket?.nameFromTokens ?? e.id,
      recent_timestamp: bucket?.last ?? "-",
      details,
    });
  }

  // Sort by name asc initially (table can re-sort)
  rows.sort((a, b) => a.entity_name.localeCompare(b.entity_name, undefined, { sensitivity: "base" }));
  return rows;
}
