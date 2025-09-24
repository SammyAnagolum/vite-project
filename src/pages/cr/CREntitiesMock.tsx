import { useMemo, useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  PencilLine,
  Trash2,
} from "lucide-react";
import { Section } from "@/components/common/Section";
import { KV } from "@/components/common/KV";
import Kpi from "@/components/common/Kpi";
import PageNumbers from "@/components/common/PageNumbers";
import { AppIcons } from "@/lib/icon-map";
import type { DataTableColumn } from "@/components/common/DataTable";
import DataTable from "@/components/common/DataTable";

/** ------------------------------------ Types ------------------------------------ */
type Row = { name: string; cr_id: string; type: "AA" | "FIP" | "FIU" };
type FilterType = "all" | Row["type"];

type EntityDetails = {
  name: string;
  id: string;
  type: Row["type"];
  spocEmail: string;
  baseUrl: string;
  ips: string | number;
};

/** ------------------------ Legacy + Given Mock Data (merged) -------------------- */
const BASE_ROWS: Row[] = [
  { name: "test Laboratories India Private Limited", cr_id: "test-fip-10", type: "FIP" },
  { name: "FIP-SIMULATOR", cr_id: "FIP-SIMULATOR-09", type: "FIP" },
  { name: "AA-SIMULATOR", cr_id: "AA-SIMULATOR", type: "AA" },
  { name: "FIP-SIMULATOR", cr_id: "FIP-SIMULATOR", type: "FIP" },
  { name: "FIU-SIMULATOR", cr_id: "afpl-FIU", type: "FIU" },
  { name: "Test-simulator", cr_id: "Test-simulator10", type: "FIP" },
  { name: "Test-simulator-updated", cr_id: "Test-simulator", type: "FIP" },
  { name: "FIP-SIMULATOR", cr_id: "FIP-SIMULATOR-21", type: "FIP" },
  { name: "FIP-SIMULATOR", cr_id: "FIP-SIMULATOR5", type: "FIP" },
  { name: "FIU-SIMULATOR", cr_id: "FIU-SIMULATOR", type: "FIU" },
];

const EXTRA_ROWS: Row[] = [
  { name: "FIP-SIMULATOR-29", cr_id: "FIP-SIMULATOR-32", type: "FIP" },
  { name: "FIU-SIMULATOR", cr_id: "afpl-FIU", type: "FIU" },
  { name: "FIU-SIMULATOR", cr_id: "HDFC-FIP", type: "FIU" },
  { name: "FIU-SIMULATOR", cr_id: "FIU-SIMULATOR", type: "FIU" },
  { name: "FIP-SIMULATOR-29", cr_id: "FIP-SIMULATOR-33", type: "FIP" },
  { name: "AA-SIMULATOR", cr_id: "AA-SIMULATOR-01", type: "AA" },
  { name: "FIP-BANK-HDFC", cr_id: "HDFC-FIP-001", type: "FIP" },
  { name: "FIU-BANK-ICICI", cr_id: "ICICI-FIU-001", type: "FIU" },
  { name: "AA-BANK-SBI", cr_id: "SBI-AA-001", type: "AA" },
  { name: "FIP-AXIS-BANK", cr_id: "AXIS-FIP-002", type: "FIP" },
  { name: "FIU-KOTAK-BANK", cr_id: "KOTAK-FIU-001", type: "FIU" },
  { name: "AA-FINVU", cr_id: "FINVU-AA-001", type: "AA" },
  { name: "FIP-YES-BANK", cr_id: "YES-FIP-001", type: "FIP" },
  { name: "FIU-INDUSIND", cr_id: "INDUSIND-FIU-001", type: "FIU" },
  { name: "AA-PERFIOS", cr_id: "PERFIOS-AA-001", type: "AA" },
  { name: "FIP-BOI", cr_id: "BOI-FIP-001", type: "FIP" },
  { name: "FIU-PNB", cr_id: "PNB-FIU-001", type: "FIU" },
  { name: "AA-COOKIEJAR", cr_id: "COOKIEJAR-AA-001", type: "AA" },
  { name: "FIP-CANARA-BANK", cr_id: "CANARA-FIP-001", type: "FIP" },
  { name: "FIU-UNION-BANK", cr_id: "UNION-FIU-001", type: "FIU" },
  { name: "AA-ONEMONEY", cr_id: "ONEMONEY-AA-001", type: "AA" },
  { name: "FIP-FEDERAL-BANK", cr_id: "FEDERAL-FIP-001", type: "FIP" },
  { name: "FIU-KARUR-VYSYA", cr_id: "KARUR-FIU-001", type: "FIU" },
  { name: "AA-ANUMATI", cr_id: "ANUMATI-AA-001", type: "AA" },
  { name: "FIP-SOUTH-INDIAN", cr_id: "SIB-FIP-001", type: "FIP" },
];

// merged & de-duped by cr_id
const INITIAL_ROWS: Row[] = (() => {
  const map = new Map<string, Row>();
  [...BASE_ROWS, ...EXTRA_ROWS].forEach((r) => map.set(r.cr_id, r));
  return Array.from(map.values());
})();

/** ----------------------------- Fake details per type --------------------------- */
const TYPE_DEFAULTS: Record<Row["type"], Omit<EntityDetails, "name" | "id">> = {
  FIP: {
    type: "FIP",
    spocEmail: "contact@fip.example.com",
    baseUrl: "v2:https://openbanking.fip.example.com/fip/",
    ips: "12",
  },
  FIU: {
    type: "FIU",
    spocEmail: "ops@fiu.example.com",
    baseUrl: "v2:https://gateway.fiu.example.com/fiu/",
    ips: "6",
  },
  AA: {
    type: "AA",
    spocEmail: "support@aa.example.com",
    baseUrl: "v2:https://api.aa.example.com/aa/",
    ips: "9",
  },
};

/** ------------------------------------ Page ------------------------------------ */
export default function CREntitiesMock() {
  // table rows become mutable so Edit/Delete can demo changes
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);

  // filters
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");
  const [qType, setQType] = useState<FilterType>("all");

  // pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // ui state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);

  // edit form (very small demo)
  const [editForm, setEditForm] = useState<{ name: string; type: Row["type"]; spocEmail: string; baseUrl: string }>({
    name: "",
    type: "FIP",
    spocEmail: "",
    baseUrl: "",
  });

  // filter results
  const filtered = useMemo(() => {
    const nq = qName.trim().toLowerCase();
    const iq = qId.trim().toLowerCase();
    return rows.filter((r) => {
      const byName = !nq || r.name.toLowerCase().includes(nq);
      const byId = !iq || r.cr_id.toLowerCase().includes(iq);
      const byType = qType === "all" || r.type === qType;
      return byName && byId && byType;
    });
  }, [rows, qName, qId, qType]);

  // stats (like lovable's StatsCards)
  const stats = useMemo(() => {
    const total = filtered.length;
    const byAA = filtered.filter((r) => r.type === "AA").length;
    const byFIP = filtered.filter((r) => r.type === "FIP").length;
    const byFIU = filtered.filter((r) => r.type === "FIU").length;
    return { total, byAA, byFIP, byFIU };
  }, [filtered]);

  // reset to page 1 when filters or rowsPerPage change
  useEffect(() => {
    setPage(1);
  }, [qName, qId, qType, rowsPerPage]);

  // pagination math
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIdx = (page - 1) * rowsPerPage;
  const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);
  const rangeStart = totalRows === 0 ? 0 : startIdx + 1;
  const rangeEnd = Math.min(startIdx + rowsPerPage, totalRows);

  const resetFilters = () => {
    setQName("");
    setQId("");
    setQType("all");
  };

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const downloadCsv = () => {
    const header = ["S.NO", "Entity Name", "Entity ID", "Type"];
    const rowsCsv = filtered.map((r, i) => [String(i + 1), r.name, r.cr_id, r.type]);
    const csv = [header, ...rowsCsv].map((r) => r.map(safeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CR_All_Entities.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /** ---------- Actions ---------- */
  const openView = (row: Row) => {
    setSelected(row);
    setViewOpen(true);
  };

  const openEdit = (row: Row) => {
    const defaults = TYPE_DEFAULTS[row.type];
    setEditForm({
      name: row.name,
      type: row.type,
      spocEmail: defaults.spocEmail,
      baseUrl: defaults.baseUrl,
    });
    setSelected(row);
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!selected) return;
    setRows((prev) =>
      prev.map((r) =>
        r.cr_id === selected.cr_id ? { ...r, name: editForm.name, type: editForm.type } : r
      )
    );
    setEditOpen(false);
  };

  const openDelete = (row: Row) => {
    setSelected(row);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!selected) return;
    setRows((prev) => prev.filter((r) => r.cr_id !== selected.cr_id));
    setConfirmOpen(false);
  };

  /** ---------- Details (fake) ---------- */
  const details: EntityDetails | null = useMemo(() => {
    if (!selected) return null;
    const d = TYPE_DEFAULTS[selected.type];
    return {
      name: selected.name,
      id: selected.cr_id,
      type: selected.type,
      spocEmail: d.spocEmail,
      baseUrl: d.baseUrl,
      ips: d.ips,
    };
  }, [selected]);

  const cols: DataTableColumn<Row>[] = [
    { key: "name", header: "Entity Name", cell: r => r.name },
    { key: "id", header: "Entity ID", cell: r => <span className="font-mono text-sm">{r.cr_id}</span> },
    { key: "type", header: "Type", headClassName: "w-[120px]", cell: r => <TypeBadge type={r.type} /> },
    {
      key: "actions",
      header: <span className="block text-center">Actions</span>,
      headClassName: "w-[140px]",
      className: "text-center",
      cell: r => (
        <div className="flex items-center justify-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => openView(r)} aria-label="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={() => openEdit(r)} aria-label="Edit">
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => openDelete(r)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="">
      <div className="mx-auto max-w-7xl py-6">
        {/* KPI cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Total (filtered)" value={stats.total.toLocaleString()} icon={<AppIcons.Users className="h-9 w-9" />} />
          <Kpi title="AA" value={stats.byAA.toLocaleString()} tone="emerald" icon={<AppIcons.AA className="h-9 w-9" />} />
          <Kpi title="FIP" value={stats.byFIP.toLocaleString()} tone="indigo" icon={<AppIcons.FIP className="h-9 w-9" />} />
          <Kpi title="FIU" value={stats.byFIU.toLocaleString()} tone="sky" icon={<AppIcons.FIU className="h-9 w-9" />} />
        </div>

        <Card className="relative p-4 md:p-5">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
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
                placeholder="e.g. FIP-SIMULATOR-09"
                value={qId}
                onChange={(e) => setQId(e.target.value)}
              />
            </div>

            <div className="w-full md:w-56">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">RE Type</label>
              <Select value={qType} onValueChange={(v) => setQType(v as FilterType)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {/* sentinel 'all' avoids empty-string crash */}
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

          {/* Table */}
          <DataTable<Row>
            data={pageRows}
            columns={cols}
            showIndex
            indexHeader="S.NO"
            startIndex={startIdx}
          />

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
        </Card>
      </div>

      {/* ------------------------- View Dialog (Details) ------------------------- */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Entity Information</DialogTitle>
            <DialogDescription>
              Read-only summary of the selected entity.
            </DialogDescription>
          </DialogHeader>
          {details && (
            <div className="space-y-4">
              <Section title="General Information">
                <KV label="Name" value={details.name} />
                <KV label="ID" value={<span className="font-mono">{details.id}</span>} />
                <KV
                  label="Type"
                  value={<TypeBadge type={details.type} />}
                />
              </Section>

              <Section title="Contacts & Network">
                <KV label="SPOC email" value={<a className="text-primary underline-offset-2 hover:underline" href={`mailto:${details.spocEmail}`}>{details.spocEmail}</a>} />
                <KV label="Base URL" value={<span className="font-mono break-all">{details.baseUrl}</span>} />
                <KV label="IPs" value={String(details.ips)} />
              </Section>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------- Edit Dialog (Demo) -------------------------- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Entity</DialogTitle>
            <DialogDescription>
              This is a lightweight demo form—no backend calls yet.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
              <Select
                value={editForm.type}
                onValueChange={(v) => setEditForm((f) => ({ ...f, type: v as Row["type"] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AA">AA</SelectItem>
                  <SelectItem value="FIP">FIP</SelectItem>
                  <SelectItem value="FIU">FIU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">SPOC email</label>
              <Input
                type="email"
                value={editForm.spocEmail}
                onChange={(e) => setEditForm((f) => ({ ...f, spocEmail: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Base URL</label>
              <Input
                value={editForm.baseUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, baseUrl: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------- Delete Confirmation (Alert) --------------------- */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entity?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You are about to delete{" "}
              <span className="font-medium">{selected?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** --- UI bits --- */
function TypeBadge({ type }: { type: Row["type"] }) {
  const map: Record<Row["type"], string> = {
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

function safeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
