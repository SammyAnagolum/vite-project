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
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";

/** -------- Types -------- */
type EntityType = "AA" | "FIP" | "FIU";
type Entity = { name: string; id: string; type: EntityType };

type TelemetryEvent = {
  entity_id: string;
  call_count: number;
  // ISO date string: YYYY-MM-DD (we only care about date granularity here)
  date: string;
};

type RowMain = {
  name: string;
  entity_id: string;
  type: EntityType;
  recent_fetch_time: string | "-";
  call_count: number; // for selected date
};

/** -------- Mock entities (same vibe as Entities page) -------- */
const ENTITIES: Entity[] = [
  { name: "FIP-SIMULATOR-29", id: "FIP-SIMULATOR-32", type: "FIP" },
  { name: "FIU-SIMULATOR", id: "afpl-FIU", type: "FIU" },
  { name: "FIU-SIMULATOR", id: "HDFC-FIP", type: "FIU" },
  { name: "FIU-SIMULATOR", id: "FIU-SIMULATOR", type: "FIU" },
  { name: "FIP-SIMULATOR-29", id: "FIP-SIMULATOR-33", type: "FIP" },
  { name: "AA-SIMULATOR", id: "AA-SIMULATOR-01", type: "AA" },
  { name: "FIP-BANK-HDFC", id: "HDFC-FIP-001", type: "FIP" },
  { name: "FIU-BANK-ICICI", id: "ICICI-FIU-001", type: "FIU" },
  { name: "AA-BANK-SBI", id: "SBI-AA-001", type: "AA" },
  { name: "FIP-AXIS-BANK", id: "AXIS-FIP-002", type: "FIP" },
  { name: "FIU-KOTAK-BANK", id: "KOTAK-FIU-001", type: "FIU" },
  { name: "AA-FINVU", id: "FINVU-AA-001", type: "AA" },
  { name: "FIP-YES-BANK", id: "YES-FIP-001", type: "FIP" },
  { name: "FIU-INDUSIND", id: "INDUSIND-FIU-001", type: "FIU" },
  { name: "AA-PERFIOS", id: "PERFIOS-AA-001", type: "AA" },
  { name: "FIP-BOI", id: "BOI-FIP-001", type: "FIP" },
  { name: "FIU-PNB", id: "PNB-FIU-001", type: "FIU" },
  { name: "AA-COOKIEJAR", id: "COOKIEJAR-AA-001", type: "AA" },
  { name: "FIP-CANARA-BANK", id: "CANARA-FIP-001", type: "FIP" },
  { name: "FIU-UNION-BANK", id: "UNION-FIU-001", type: "FIU" },
  { name: "AA-ONEMONEY", id: "ONEMONEY-AA-001", type: "AA" },
  { name: "FIP-FEDERAL-BANK", id: "FEDERAL-FIP-001", type: "FIP" },
  { name: "FIU-KARUR-VYSYA", id: "KARUR-FIU-001", type: "FIU" },
  { name: "AA-ANUMATI", id: "ANUMATI-AA-001", type: "AA" },
  { name: "FIP-SOUTH-INDIAN", id: "SIB-FIP-001", type: "FIP" },
];

/** -------- Random telemetry generator (21 days of sparse data) -------- */
function generateTelemetry(seed = 7): { events: TelemetryEvent[]; lastByEntity: Record<string, string> } {
  const rng = mulberry32(seed);
  const today = new Date();
  const daysBack = 21;

  const events: TelemetryEvent[] = [];
  const lastByEntity: Record<string, string> = {};

  for (const e of ENTITIES) {
    const activityDays = 6 + Math.floor(rng() * 8); // 6..13 days active in this window
    const activeSet = new Set<number>();
    while (activeSet.size < activityDays) {
      activeSet.add(Math.floor(rng() * daysBack)); // 0..20
    }
    for (const offset of activeSet) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const date = toISODate(d);
      const call_count = 1 + Math.floor(rng() * 25);
      events.push({ entity_id: e.id, call_count, date });
      if (!lastByEntity[e.id] || lastByEntity[e.id] < date) {
        lastByEntity[e.id] = date;
      }
    }
  }

  return { events, lastByEntity };
}

/** -------- Page -------- */
export default function CRTelemetryMock() {
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");
  const [qType, setQType] = useState<"all" | EntityType>("all");
  const [dateStr, setDateStr] = useState<string>(toISODate(new Date())); // default = today

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // mock data (re-gen on refresh)
  const [{ events, lastByEntity }, setMock] = useState(() => generateTelemetry());
  function refresh() {
    setIsRefreshing(true);
    setTimeout(() => {
      setMock(generateTelemetry(Math.floor(Math.random() * 10_000)));
      setIsRefreshing(false);
    }, 500);
  }

  // derived, filtered main rows for selected date
  const rowsMain: RowMain[] = useMemo(() => {
    const baseMap = new Map<string, RowMain>();
    ENTITIES.forEach((e) =>
      baseMap.set(e.id, {
        name: e.name,
        entity_id: e.id,
        type: e.type,
        recent_fetch_time: lastByEntity[e.id] ?? "-",
        call_count: 0,
      })
    );

    events.forEach((ev) => {
      if (dateStr && ev.date !== dateStr) return;
      const row = baseMap.get(ev.entity_id);
      if (!row) return;
      row.call_count += ev.call_count;
    });

    let out = Array.from(baseMap.values());
    const nq = qName.trim().toLowerCase();
    const iq = qId.trim().toLowerCase();
    out = out.filter((r) => {
      const byName = !nq || r.name.toLowerCase().includes(nq);
      const byId = !iq || r.entity_id.toLowerCase().includes(iq);
      const byType = qType === "all" || r.type === qType;
      return byName && byId && byType;
    });

    return out;
  }, [events, lastByEntity, dateStr, qName, qId, qType]);

  // KPIs (for selected date & applied filters)
  const kpis = useMemo(() => {
    const total = rowsMain.reduce((sum, r) => sum + r.call_count, 0);
    const activeByType = { AA: 0, FIP: 0, FIU: 0 } as Record<EntityType, number>;
    rowsMain.forEach((r) => {
      if (r.call_count > 0) activeByType[r.type] += 1;
    });
    return { total, activeAA: activeByType.AA, activeFIP: activeByType.FIP, activeFIU: activeByType.FIU };
  }, [rowsMain]);

  // drill-in state
  const [drillEntity, setDrillEntity] = useState<{ id: string; name: string } | null>(null);

  // drill-in rows (per-date call counts for selected entity)
  const drillRows = useMemo(() => {
    if (!drillEntity) return [];
    const map = new Map<string, number>();
    events.forEach((ev) => {
      if (ev.entity_id !== drillEntity.id) return;
      map.set(ev.date, (map.get(ev.date) ?? 0) + ev.call_count);
    });
    return Array.from(map.entries())
      .map(([date, call_count]) => ({ date, call_count }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // desc
  }, [drillEntity, events]);

  const drillTotal = useMemo(() => drillRows.reduce((s, r) => s + r.call_count, 0), [drillRows]);

  // pagination
  useEffect(() => setPage(1), [qName, qId, qType, dateStr, rowsPerPage, drillEntity]);
  const source = drillEntity ? drillRows : rowsMain;
  const totalRows = source.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIdx = (page - 1) * rowsPerPage;
  const pageRows = source.slice(startIdx, startIdx + rowsPerPage);
  const rangeStart = totalRows === 0 ? 0 : startIdx + 1;
  const rangeEnd = Math.min(startIdx + rowsPerPage, totalRows);

  // table columns
  type DrillRow = { date: string; call_count: number };

  const mainCols: DataTableColumn<RowMain>[] = [
    {
      key: "name",
      header: "Entity Name",
      cell: (r) => (
        <button
          className="underline underline-offset-2 hover:opacity-90"
          onClick={() => setDrillEntity({ id: r.entity_id, name: r.name })}
        >
          {r.name}
        </button>
      ),
    },
    {
      key: "id",
      header: "Entity ID",
      cell: (r) => <span className="font-mono text-sm">{r.entity_id}</span>,
    },
    {
      key: "type",
      header: "Type",
      headClassName: "w-[120px]",
      cell: (r) => <TypeBadge type={r.type} />,
    },
    {
      key: "recent",
      header: "Recent Fetch Date",
      headClassName: "w-[180px]",
      cell: (r) => (r.recent_fetch_time === "-" ? "-" : r.recent_fetch_time),
    },
    {
      key: "count",
      header: "Fetch Count",
      headClassName: "w-[140px]",
      align: "right",
      cell: (r) => r.call_count.toLocaleString(),
    },
  ];

  const drillCols: DataTableColumn<DrillRow>[] = [
    { key: "date", header: "Date", cell: (r) => r.date },
    {
      key: "count",
      header: "Fetch Count",
      headClassName: "w-[140px]",
      align: "right",
      cell: (r) => r.call_count.toLocaleString(),
    },
  ];

  // CSV download (context-aware: main vs drill)
  function downloadCsv() {
    if (drillEntity) {
      const header = ["S.NO", "Date", "Fetch Count"];
      const rows = drillRows.map((r, i) => [String(i + 1), r.date, String(r.call_count)]);
      toCsvAndDownload([header, ...rows], `CR_Telemetry_${drillEntity.name}.csv`);
    } else {
      const header = ["S.NO", "Entity Name", "Entity ID", "Type", "Recent Fetch Date", "Fetch Count"];
      const rows = rowsMain.map((r, i) => [
        String(i + 1),
        r.name,
        r.entity_id,
        r.type,
        r.recent_fetch_time === "-" ? "-" : r.recent_fetch_time,
        String(r.call_count),
      ]);
      toCsvAndDownload([header, ...rows], `CR_Telemetry_${dateStr || "all"}.csv`);
    }
  }

  const resetFilters = () => {
    setQName("");
    setQId("");
    setQType("all");
    setDateStr(toISODate(new Date()));
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl py-6">
        {/* KPI cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Total Calls (filtered date)" value={kpis.total.toLocaleString()} icon={<AppIcons.Activity className="h-9 w-9" />} />
          <Kpi title="AA active" value={kpis.activeAA.toLocaleString()} tone="indigo" icon={<AppIcons.AA className="h-9 w-9" />} />
          <Kpi title="FIP active" value={kpis.activeFIP.toLocaleString()} tone="sky" icon={<AppIcons.FIP className="h-9 w-9" />} />
          <Kpi title="FIU active" value={kpis.activeFIU.toLocaleString()} tone="emerald" icon={<AppIcons.FIU className="h-9 w-9" />} />
        </div>

        <Card className="relative p-4 md:p-5">
          {/* Filters */}
          {!drillEntity && (
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

              <div className="flex gap-2 md:ml-auto">
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isRefreshing ? "Refreshing…" : "Refresh"}
                </Button>
              </div>
            </div>
          )}

          {/* Drill header */}
          {drillEntity && (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setDrillEntity(null)}>
                  ← Back
                </Button>
                <div className="text-sm">
                  <div className="font-medium">Entity Name: {drillEntity.name}</div>
                  <div className="text-muted-foreground">Total Fetch Count: {drillTotal}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Showing daily counts (last 21 days)
              </div>
            </div>
          )}

          {/* Table via DataTable */}
          {!drillEntity ? (
            <DataTable<RowMain>
              data={pageRows as RowMain[]}
              columns={mainCols}
              showIndex
              indexHeader="S.NO"
              startIndex={startIdx + 1}
              emptyContent={<EmptyState message="No records match your filters." />}
              getRowKey={(r) => r.entity_id}
            />
          ) : (
            <DataTable<{ date: string; call_count: number }>
              data={pageRows as { date: string; call_count: number }[]}
              columns={drillCols}
              showIndex
              indexHeader="S.NO"
              startIndex={startIdx + 1}
              emptyContent={<EmptyState message="No fetches recorded for this entity yet." />}
              getRowKey={(r) => `d-${r.date}`}
            />
          )}

          {/* Footer: Download + Pagination */}
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

/** -------- UI bits (same tone/style as Entities) -------- */
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

/** -------- Small utils -------- */
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function toCsvAndDownload(matrix: string[][], filename: string) {
  const csv = matrix.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(s: string) {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// tiny seeded RNG so refresh feels different but deterministic-ish
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
