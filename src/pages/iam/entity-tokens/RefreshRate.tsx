import React, { useMemo, useState, useEffect } from "react";
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
  Calendar,
  Search,
  RefreshCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  Activity,
  Clock,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import Kpi from "@/components/common/Kpi";
import EmptyState from "@/components/common/EmptyState";
import PageNumbers from "@/components/common/PageNumbers";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";

/** ---------------- Types ---------------- */
type DetailRow = {
  date: string;              // YYYY-MM-DD
  tokens_issued: number;
  tokens_not_issued: number;
  tokens_total: number;
};

type EntityRow = {
  entity_name: string;
  entity_id: string;
  recent_timestamp: string | "-"; // latest known token time
  details: DetailRow[];           // per-day details (mocked)
};

/** ---------------- Mock Data ---------------- */
const MOCK: EntityRow[] = [
  {
    entity_name: "AA-SIMULATOR",
    entity_id: "AA-SIMULATOR",
    recent_timestamp: "2025-07-11 11:45:49",
    details: [
      { date: "2025-07-11", tokens_issued: 2, tokens_not_issued: 0, tokens_total: 2 },
      { date: "2025-07-10", tokens_issued: 1, tokens_not_issued: 0, tokens_total: 1 },
    ],
  },
  {
    entity_name: "FIU-SIMULATOR",
    entity_id: "FIU-SIMULATOR",
    recent_timestamp: "2025-05-12 15:10:00",
    details: [
      { date: "2025-07-11", tokens_issued: 0, tokens_not_issued: 0, tokens_total: 0 },
      { date: "2025-05-12", tokens_issued: 0, tokens_not_issued: 2, tokens_total: 2 },
    ],
  },
  {
    entity_name: "FIP-SIMULATOR",
    entity_id: "FIP-SIMULATOR",
    recent_timestamp: "2025-06-24 17:20:24",
    details: [
      { date: "2025-07-11", tokens_issued: 0, tokens_not_issued: 1, tokens_total: 1 },
      { date: "2025-06-24", tokens_issued: 3, tokens_not_issued: 0, tokens_total: 3 },
    ],
  },
  {
    entity_name: "HDFC-FIP",
    entity_id: "HDFC-FIP-001",
    recent_timestamp: "2025-07-10 09:30:25",
    details: [
      { date: "2025-07-11", tokens_issued: 6, tokens_not_issued: 1, tokens_total: 7 },
      { date: "2025-07-10", tokens_issued: 5, tokens_not_issued: 0, tokens_total: 5 },
    ],
  },
  {
    entity_name: "ICICI-FIU",
    entity_id: "ICICI-FIU-001",
    recent_timestamp: "2025-07-09 14:22:18",
    details: [
      { date: "2025-07-11", tokens_issued: 3, tokens_not_issued: 0, tokens_total: 3 },
      { date: "2025-07-09", tokens_issued: 2, tokens_not_issued: 1, tokens_total: 3 },
    ],
  },
  {
    entity_name: "SBI-AA",
    entity_id: "SBI-AA-001",
    recent_timestamp: "2025-07-08 10:15:42",
    details: [
      { date: "2025-07-11", tokens_issued: 8, tokens_not_issued: 0, tokens_total: 8 },
      { date: "2025-07-08", tokens_issued: 2, tokens_not_issued: 0, tokens_total: 2 },
    ],
  },
  {
    entity_name: "AXIS-FIP",
    entity_id: "AXIS-FIP-002",
    recent_timestamp: "2025-07-07 16:45:33",
    details: [
      { date: "2025-07-11", tokens_issued: 4, tokens_not_issued: 2, tokens_total: 6 },
      { date: "2025-07-07", tokens_issued: 1, tokens_not_issued: 0, tokens_total: 1 },
    ],
  },
  {
    entity_name: "KOTAK-FIU",
    entity_id: "KOTAK-FIU-001",
    recent_timestamp: "2025-07-06 12:20:15",
    details: [
      { date: "2025-07-11", tokens_issued: 6, tokens_not_issued: 0, tokens_total: 6 },
      { date: "2025-07-06", tokens_issued: 1, tokens_not_issued: 0, tokens_total: 1 },
    ],
  },
];

/** ---------------- Page ---------------- */
export default function RefreshRate() {
  // filters
  const [selectedDate, setSelectedDate] = useState<string>(() => todayISO());
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");

  // pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // detail view toggle
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // reset page on filter change
  useEffect(() => setPage(1), [selectedDate, qName, qId, rowsPerPage]);

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

    return MOCK
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
  }, [selectedDate, qName, qId]);

  // KPIs
  const kpis = useMemo(() => {
    const highVolume = aggregated.filter((r) => r.tokens_total > 5).length;
    const totalIssued = aggregated.reduce((s, r) => s + r.tokens_issued, 0);
    const avgPerEntity = aggregated.length ? Math.round(totalIssued / aggregated.length) : 0;
    const inactive24h = MOCK.filter((r) => {
      const last = r.recent_timestamp !== "-" ? r.recent_timestamp : "";
      if (!last) return true;
      const lastDate = new Date(last.replace(" ", "T"));
      const sel = new Date(`${selectedDate}T00:00:00`);
      const diffHrs = Math.abs(+sel - +lastDate) / 36e5;
      return diffHrs > 24;
    }).length;
    return { highVolume, inactive24h, totalIssued, avgPerEntity };
  }, [aggregated, selectedDate]);

  // pagination math
  const totalRows = aggregated.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIdx = (page - 1) * rowsPerPage;
  const pageRows = aggregated.slice(startIdx, startIdx + rowsPerPage);
  const rangeStart = totalRows === 0 ? 0 : startIdx + 1;
  const rangeEnd = Math.min(startIdx + rowsPerPage, totalRows);

  const resetFilters = () => {
    setSelectedDate(todayISO());
    setQName("");
    setQId("");
  };

  const downloadCsv = () => {
    const header = [
      "S.NO",
      "Entity Name",
      "Entity ID",
      "Last Token Issued Timestamp",
      "Tokens Issued",
      "Tokens Not Issued",
      "Total Tokens",
      `For Date: ${selectedDate}`,
    ];
    const rows = aggregated.map((r, i) => [
      String(i + 1),
      r.entity_name,
      r.entity_id,
      r.recent_timestamp,
      String(r.tokens_issued),
      String(r.tokens_not_issued),
      String(r.tokens_total),
    ]);
    const csv = [header, ...rows].map((r) => r.map(safeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IAM_EntityTokens_RefreshRate_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedEntity = useMemo(
    () => MOCK.find((e) => e.entity_id === selectedEntityId) || null,
    [selectedEntityId]
  );

  // columns
  const mainCols: DataTableColumn<AggregatedRow>[] = [
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
    },
    {
      key: "id",
      header: "Entity ID",
      cell: (r) => <span className="font-mono text-sm">{r.entity_id}</span>,
    },
    {
      key: "ts",
      header: "Last Token Issued Timestamp",
      headClassName: "w-[220px]",
      cell: (r) => r.recent_timestamp,
    },
    {
      key: "issued",
      header: "Issued",
      headClassName: "w-[140px]",
      align: "right",
      cell: (r) => r.tokens_issued,
    },
    {
      key: "not",
      header: "Not Issued",
      headClassName: "w-[160px]",
      align: "right",
      cell: (r) => r.tokens_not_issued,
    },
    {
      key: "total",
      header: "Total",
      headClassName: "w-[120px]",
      align: "right",
      cell: (r) => <span className="font-medium">{r.tokens_total}</span>,
    },
  ];

  const detailCols: DataTableColumn<DetailRow>[] = [
    { key: "date", header: "Date", cell: (r) => r.date },
    { key: "i", header: "Tokens Issued", headClassName: "w-[160px]", align: "right", cell: (r) => r.tokens_issued },
    { key: "ni", header: "Tokens Not Issued", headClassName: "w-[180px]", align: "right", cell: (r) => r.tokens_not_issued },
    { key: "t", header: "Total", headClassName: "w-[140px]", align: "right", cell: (r) => <span className="font-medium">{r.tokens_total}</span> },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl py-6">
        {/* KPIs */}
        {!selectedEntity && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={<TrendingUp className="h-9 w-9" />} title="High Volume (>5)" value={kpis.highVolume} tone="emerald" />
            <Kpi icon={<Clock className="h-9 w-9" />} title="Inactive (24h+)" value={kpis.inactive24h} tone="amber" />
            <Kpi icon={<BarChart3 className="h-9 w-9" />} title="Total Tokens Issued" value={kpis.totalIssued} tone="indigo" />
            <Kpi icon={<Activity className="h-9 w-9" />} title="Avg Tokens/Entity" value={kpis.avgPerEntity} tone="sky" />
          </div>
        )}

        <Card className="p-4 md:p-5">
          {/* Filters / Header row */}
          {!selectedEntity ? (
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full md:w-56">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  For a specific past date
                </label>
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
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Search by Entity Name
                </label>
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
                <Button variant="outline" onClick={() => {/* wire to real refetch */ }}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
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
            <>
              <DataTable<AggregatedRow>
                data={pageRows}
                columns={mainCols}
                showIndex
                indexHeader="S.NO"
                startIndex={startIdx + 1}
                emptyContent={<EmptyState message="No entities for the selected filters." />}
                getRowKey={(r) => r.entity_id}
              />

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
                    <Select
                      value={String(rowsPerPage)}
                      onValueChange={(v) => setRowsPerPage(Number(v))}
                    >
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
            </>
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
  if (!entity) return null;

  const totals = entity.details.reduce(
    (acc, d) => {
      acc.issued += d.tokens_issued;
      acc.notIssued += d.tokens_not_issued;
      acc.total += d.tokens_total;
      return acc;
    },
    { issued: 0, notIssued: 0, total: 0 }
  );

  const download = () => {
    const header = ["S.NO", "Date", "Tokens Issued", "Tokens Not Issued", "Total Tokens"];
    const rows = entity.details
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((d, i) => [
        String(i + 1),
        d.date,
        String(d.tokens_issued),
        String(d.tokens_not_issued),
        String(d.tokens_total),
      ]);
    const csv = [header, ...rows].map((r) => r.map(safeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IAM_EntityTokens_${entity.entity_id}_Detail.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Entity KPIs */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MiniKpi label="Issued" value={totals.issued} />
        <MiniKpi label="Not Issued" value={totals.notIssued} />
        <MiniKpi label="Total" value={totals.total} />
      </div>

      <DataTable<DetailRow>
        data={[...entity.details].sort((a, b) => (a.date < b.date ? 1 : -1))}
        columns={detailCols}
        showIndex
        indexHeader="S.NO"
        startIndex={1}
        emptyContent={<EmptyState message="No token activity for this entity." />}
        getRowKey={(r) => `${entity.entity_id}-${r.date}`}
      />

      <div className="mt-4">
        <Button onClick={download}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>
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

function safeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
