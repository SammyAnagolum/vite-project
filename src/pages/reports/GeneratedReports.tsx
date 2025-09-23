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
// import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, RefreshCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
// wire your real API here
import { useReportsApi } from "@/services/reportsApi"; // fetchGeneratedReports, downloadReport, deleteReport

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

export default function GeneratedReports() {
  const { fetchGeneratedReports, downloadReport, deleteReport } = useReportsApi();

  // data
  const [rows, setRows] = useState<GeneratedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");

  // pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // delete confirm
  const [toDelete, setToDelete] = useState<GeneratedRow | null>(null);
  type Status = GeneratedRow["status"];
  type StatusFilter = Status | "__ALL__";
  const [status, setStatus] = useState<StatusFilter>("__ALL__");

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await fetchGeneratedReports();
        const list: GeneratedRow[] = (res.requests ?? []).map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          requestId: String(r.requestId ?? r.id),
          name: String(r.name ?? r.reportName ?? "Report"),
          status: (r.status ?? "PENDING").toUpperCase(),
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

  useEffect(() => setPage(1), [q, status, rowsPerPage]);

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    return rows.filter(r => {
      const hitQ = !qlc || [r.name, r.status, r.appliedFilter].some(v => String(v).toLowerCase().includes(qlc));
      const hitStatus = status === "__ALL__" || r.status === status;
      return hitQ && hitStatus;
    });
  }, [rows, q, status]);

  // pagination math
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIdx = (page - 1) * rowsPerPage;
  const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);
  const rangeStart = totalRows ? startIdx + 1 : 0;
  const rangeEnd = Math.min(startIdx + rowsPerPage, totalRows);

  const refresh = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetchGeneratedReports();
      const list: GeneratedRow[] = (res.requests ?? []).map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        requestId: String(r.requestId ?? r.id),
        name: String(r.name ?? r.reportName ?? "Report"),
        status: (r.status ?? "PENDING").toUpperCase(),
        appliedFilter: String(r.appliedFilter ?? r.filter ?? "—"),
        downloadedCount: Number(r.downloadedCount ?? r.downloads ?? 0),
      }));
      setRows(list);
      toast.success("Generated reports refreshed");
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

  return (
    <div className="min-h-screen">
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
              <Button variant="outline" onClick={() => { setQ(""); setStatus("__ALL__"); }}>Reset</Button>
              <Button variant="outline" onClick={refresh}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="relative overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background/80 backdrop-blur">
                <tr className="border-b border-border [&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                  <th className="w-[48px] text-center">#</th>
                  <th>Report Name</th>
                  <th className="w-[140px]">Status</th>
                  <th>Applied Report Filter</th>
                  <th className="w-[160px] text-right">Downloaded Count</th>
                  <th className="w-[120px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">Loading…</td></tr>
                ) : err ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-destructive">{err}</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">Nothing to show.</td></tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={r.requestId} className="odd:bg-muted/40 hover:bg-accent transition-colors">
                      <td className="px-3 py-3 text-center tabular-nums">{startIdx + i + 1}</td>
                      <td className="px-3 py-3 font-medium">{r.name}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${STATUS_TONE[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">{r.appliedFilter}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.downloadedCount}</td>
                      <td className="px-3 py-3 text-center">
                        <TooltipProvider>
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => doDownload(r)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download PDF</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setToDelete(r)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">Rows {rangeStart}-{rangeEnd} of {totalRows}</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
                  <SelectTrigger className="h-8 w-[84px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <div className="text-xs tabular-nums">Page {page} of {totalPages}</div>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
              </div>
            </div>
          </div>
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
