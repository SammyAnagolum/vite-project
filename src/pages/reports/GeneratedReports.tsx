import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, HelpCircle, RefreshCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useReportsApi } from "@/services/reportsApi"; // fetchGeneratedReports, downloadReport, deleteReport
import DataTable from "@/components/common/DataTable";
import type { DataTableColumn } from "@/components/common/data-table/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type GeneratedRow = {
  requestId: string;
  name: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  appliedFilter: string;
  downloadedCount: number;
};

const STATUS_TONE: Record<GeneratedRow["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

const STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
type Status = typeof STATUSES[number];
type StatusFilter = Status | "__ALL__";

function toStatus(v: unknown): Status {
  const s = String(v ?? "").toUpperCase();
  return (STATUSES as readonly string[]).includes(s) ? (s as Status) : "PENDING";
}

export default function GeneratedReports() {
  const { fetchGeneratedReports, downloadReport, deleteReport } = useReportsApi();

  // data
  const [rows, setRows] = useState<GeneratedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("__ALL__");

  // delete confirm
  const [toDelete, setToDelete] = useState<GeneratedRow | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await fetchGeneratedReports();
        const list: GeneratedRow[] = (res.requests ?? []).map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          requestId: String(r.requestId ?? r.id),
          name: String(r.name ?? r.reportName ?? "Report"),
          status: toStatus(r.status),
          appliedFilter: String(r.appliedFilter ?? r.filter ?? "—"),
          downloadedCount: Number(r.downloadedCount ?? r.downloads ?? 0),
        }));
        setRows(list);
      } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setErr(e?.message || "Failed to load generated reports");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchGeneratedReports]);

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    return rows.filter(r => {
      const hitQ = !qlc || [r.name, r.status, r.appliedFilter].some(v => String(v).toLowerCase().includes(qlc));
      const hitStatus = status === "__ALL__" || r.status === status;
      return hitQ && hitStatus;
    });
  }, [rows, q, status]);

  // columns (define BEFORE we compute sorted)
  const cols: DataTableColumn<GeneratedRow>[] = useMemo(() => [
    { key: "name", header: "Report Name", cell: r => <span className="font-medium">{r.name}</span>, sortBy: "name" },
    {
      key: "status",
      header: "Status",
      headClassName: "w-[140px]",
      cell: r => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${STATUS_TONE[r.status]}`}>
          {r.status}
        </span>
      ),
      sortBy: "status",
    },
    { key: "appliedFilter", header: "Applied Report Filter", cell: r => r.appliedFilter, sortBy: "appliedFilter" },
    { key: "downloadedCount", header: "Downloaded Count", headClassName: "w-[160px]", align: "right", cell: r => r.downloadedCount, sortBy: "downloadedCount" },
    {
      key: "actions",
      header: <span className="block text-center">Actions</span>,
      headClassName: "w-[120px]",
      className: "text-center",
      sortable: false,
      cell: r => (
        <div className="flex items-center justify-center gap-2">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => doDownload(r)} aria-label="Download">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setToDelete(r)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetchGeneratedReports();
      const list: GeneratedRow[] = (res.requests ?? []).map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        requestId: String(r.requestId ?? r.id),
        name: String(r.name ?? r.reportName ?? "Report"),
        status: toStatus(r.status),
        appliedFilter: String(r.appliedFilter ?? r.filter ?? "—"),
        downloadedCount: Number(r.downloadedCount ?? r.downloads ?? 0),
      }));
      setRows(list);
      toast.success("Generated reports refreshed");
      // Intentionally do NOT reset sorting on refresh
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setErr(e?.message || "Failed to refresh");
      toast.error("Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  const doDownload = async (row: GeneratedRow) => {
    try {
      await downloadReport(row.requestId, row.name);
      toast.success("Download started");
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e?.message || "Failed to download");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteReport(toDelete.requestId);
      toast.success("Report deleted");
      setRows(prev => prev.filter(r => r.requestId !== toDelete.requestId));
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e?.message || "Failed to delete");
    } finally {
      setToDelete(null);
    }
  };

  const onReset = () => {
    setQ("");
    setStatus("__ALL__");
  };

  return (
    <div className="">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-medium">Generated Reports</h2>
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
                Track report requests and status, download completed files, delete rows, filter by status, and refresh.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="mx-auto max-w-7xl py-6">
        <Card className="p-4 md:p-5">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Report name, filter, status…" className="pl-8" />
              </div>
            </div>

            <div className="w-full md:w-56">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">All statuses</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                </SelectContent>
              </Select>
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
          <DataTable<GeneratedRow>
            data={filtered}
            columns={cols}
            showIndex
            indexHeader="#"
            startIndex={1}      // 1-based S.NO per page
            loading={loading}
            error={err}
            emptyMessage="Nothing to show."
            getRowKey={(r) => r.requestId}
            initialSort={{ key: "name", direction: "asc" }}
            exportCsvFilename="Generated_Reports.csv" // ← optional
          />
        </Card>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-sm text-muted-foreground">
            This action permanently removes<span className="font-semibold text-foreground"> {toDelete?.name}</span>.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
