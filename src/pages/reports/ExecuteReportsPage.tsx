import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, RefreshCcw, Search, CalendarDays, HelpCircle } from "lucide-react";
import { toast } from "sonner";
// wire your real API here
import { useReportsApi } from "@/services/reportsApi"; // fetchDashboards, generateReport
import type { DataTableColumn } from "@/components/common/data-table/types";
import DataTable from "@/components/common/DataTable";
import { fmtIST, parseIstString } from "@/lib/datetime";

type Dashboard = {
  id: string;
  name: string;
  createdBy: string;
  modifiedAt: string; // ISO or display string
  dashboardId?: string; // if your backend uses this name
};

const QUICK_RANGES = [
  "Last 5 minutes", "Last 15 minutes", "Last 30 minutes", "Last 1 hour",
  "Last 2 hours", "Last 3 hours", "Last 12 hours", "Last 1 day",
  "Last 2 days", "Last 7 days", "Last 2 weeks", "Last 1 month",
  "Last 1 year", "Last 2 years", "Custom",
] as const;
type QuickRange = typeof QUICK_RANGES[number];

export default function ExecuteReportsPage() {
  const { fetchDashboards, generateReport } = useReportsApi();

  // data
  const [rows, setRows] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters/search
  const [q, setQ] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState<string>("");

  // dialog state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Dashboard | null>(null);

  // time range state
  const [range, setRange] = useState<QuickRange>("Last 1 month");
  const [fromDate, setFromDate] = useState<string>(""); // YYYY-MM-DD
  const [fromTime, setFromTime] = useState<string>(""); // HH:mm
  const [toDate, setToDate] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await fetchDashboards();
        const list: Dashboard[] = res.dashboards?.map((d: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: String(d.id ?? d.dashboard_id ?? d.dashboardId),
          dashboardId: String(d.dashboard_id ?? d.dashboardId ?? d.id),
          name: d.name,
          createdBy: d.createdBy ?? d.owner ?? "—",
          modifiedAt: d.modifiedAt ?? d.updatedAt ?? "—",
        })) ?? [];
        setRows(list);
      } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setErr(e?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchDashboards]);

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    return rows.filter(r => {
      const hitQ = !qlc || [r.name, r.createdBy, r.modifiedAt].some(v => String(v).toLowerCase().includes(qlc));
      const hitCreated = !createdByFilter || String(r.createdBy).toLowerCase().includes(createdByFilter.toLowerCase());
      return hitQ && hitCreated;
    });
  }, [rows, q, createdByFilter]);

  // columns (define BEFORE sorting)
  const cols: DataTableColumn<Dashboard>[] = useMemo(() => [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span>, sortBy: "name" },
    { key: "created", header: "Created By", headClassName: "w-[200px]", cell: (r) => r.createdBy, sortBy: "createdBy" },
    { key: "modified", header: "Modified At", headClassName: "w-[220px]", cell: (r) => r.modifiedAt, sortBy: "modifiedAt" },
    {
      key: "actions",
      header: <span className="block text-center">Actions</span>,
      headClassName: "w-[120px]",
      className: "text-center",
      sortable: false,
      cell: (r) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={() => openGenerateDialog(r)} variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generate this report</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
  ], []); // columns are static here

  const refresh = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetchDashboards();
      const list: Dashboard[] = res.dashboards?.map((d: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: String(d.id ?? d.dashboard_id ?? d.dashboardId),
        dashboardId: String(d.dashboard_id ?? d.dashboardId ?? d.id),
        name: d.name,
        createdBy: d.createdBy ?? d.owner ?? "—",
        modifiedAt: d.modifiedAt ?? d.updatedAt ?? "—",
      })) ?? [];
      setRows(list);
      toast.success("Reports refreshed");
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setErr(e?.message || "Failed to refresh");
      toast.error("Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  function openGenerateDialog(item: Dashboard) {
    setSelected(item);
    setRange("Last 1 month");
    setFromDate(""); setFromTime(""); setToDate(""); setToTime("");
    setOpen(true);
  }

  function closeGenerateDialog() {
    setOpen(false);
    setSelected(null);
  }

  const parsedRange = useMemo(
    () => buildRange(range, fromDate, fromTime, toDate, toTime),
    [range, fromDate, fromTime, toDate, toTime]
  );
  const isGenerateDisabled = !selected || !parsedRange;

  const handleGenerate = async () => {
    if (!selected || !parsedRange) return;
    try {
      await generateReport({
        dashboard_id: selected.dashboardId ?? selected.id,
        start_time: parsedRange.start.toISOString(),
        end_time: parsedRange.end.toISOString(),
        export_format: "PDF",
      });
      toast.success("Report request submitted");
      closeGenerateDialog();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e?.message || "Failed to submit report");
    }
  };

  const onReset = () => {
    setQ(""); setCreatedByFilter("");
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-medium">Execute Reports</h2>
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
                Search dashboards, choose a time range (quick or custom), and submit report generation.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Card className="relative p-4 md:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Label className="mb-1 block text-xs">Search reports</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Name, owner, modified…" className="pl-8" />
            </div>
          </div>

          <div className="w-full md:w-56">
            <Label className="mb-1 block text-xs">Created By</Label>
            <Input value={createdByFilter} onChange={(e) => setCreatedByFilter(e.target.value)} placeholder="Filter by owner" />
          </div>

          <div className="flex gap-2 md:ml-auto">
            <Button variant="outline" onClick={onReset}>Reset</Button>
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <DataTable<Dashboard>
          data={filtered}
          columns={cols}
          className="flex-1 min-h-0 w-full"
          containerClassName="flex-1 min-h-0 w-full"
          showIndex
          startIndex={1}
          emptyMessage="No reports match your filters."
          loading={loading}
          error={err}
          getRowKey={(r) => r.id || r.dashboardId || r.name}
          initialSort={{ key: "name", direction: "asc" }}
        />
      </Card>

      {/* Generate Dialog */}
      <Dialog open={open} onOpenChange={(v) => !v ? closeGenerateDialog() : setOpen(true)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Time Range - {selected?.name ?? "Report"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Absolute range */}
            <div>
              <div className="mb-2 text-sm font-medium text-muted-foreground">Absolute time range</div>
              <div className="space-y-3 rounded-lg border p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">From (date)</Label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">From (time)</Label>
                    <Input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">To (date)</Label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">To (time)</Label>
                    <Input type="time" value={toTime} onChange={e => setToTime(e.target.value)} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Selected: {parsedRange ? fmtIST(parsedRange.start) + " - " + fmtIST(parsedRange.end) : ""} : {range}
                </div>
              </div>
            </div>

            {/* Right: Quick ranges */}
            <div>
              <div className="mb-2 text-sm font-medium text-muted-foreground">Quick ranges</div>
              <div className="rounded-lg border">
                <div className="max-h-[220px] overflow-auto">
                  {QUICK_RANGES.map((r) => (
                    <button
                      key={r}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted ${range === r ? "bg-muted" : ""}`}
                      onClick={() => setRange(r)}
                    >
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" /> {r}
                      </span>
                      {range === r && <span className="text-xs text-primary">Selected</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button onClick={handleGenerate} disabled={isGenerateDisabled}>
              <Play className="mr-2 h-4 w-4" />
              Generate Report (PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Helpers **/

function buildRange(
  label: QuickRange,
  fromDate: string, fromTime: string,
  toDate: string, toTime: string
): { start: Date; end: Date } | null {
  if (label === "Custom") {
    if (!fromDate || !toDate) return null;
    const s = parseIstString(`${fromDate} ${fromTime ? `${fromTime}:00` : "00:00:00"}`);
    const e = parseIstString(`${toDate} ${toTime ? `${toTime}:59` : "23:59:59"}`);
    if (!s || !e || s > e) return null;
    return { start: s, end: e };
  }
  const end = parseIstString(fmtIST())!;
  const start = new Date(end);
  const map: Record<string, number> = {
    "Last 5 minutes": 5 * 60,
    "Last 15 minutes": 15 * 60,
    "Last 30 minutes": 30 * 60,
    "Last 1 hour": 60 * 60,
    "Last 2 hours": 2 * 60 * 60,
    "Last 3 hours": 3 * 60 * 60,
    "Last 12 hours": 12 * 60 * 60,
    "Last 1 day": 24 * 60 * 60,
    "Last 2 days": 2 * 24 * 60 * 60,
    "Last 7 days": 7 * 24 * 60 * 60,
    "Last 2 weeks": 14 * 24 * 60 * 60,
  };
  if (label in map) {
    start.setSeconds(start.getSeconds() - map[label]);
    return { start, end };
  }
  if (label === "Last 1 month") { start.setMonth(start.getMonth() - 1); return { start, end }; }
  if (label === "Last 1 year") { start.setFullYear(start.getFullYear() - 1); return { start, end }; }
  if (label === "Last 2 years") { start.setFullYear(start.getFullYear() - 2); return { start, end }; }
  return null;
}
