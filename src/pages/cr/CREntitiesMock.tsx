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
  RefreshCw,
  Eye,
  PencilLine,
  Trash2,
  Copy
} from "lucide-react";
import { Section } from "@/components/common/Section";
import { KV } from "@/components/common/KV";
import Kpi from "@/components/common/Kpi";
import { AppIcons } from "@/lib/icon-map";
import type { DataTableColumn } from "@/components/common/data-table/types";
import DataTable from "@/components/common/DataTable";
import { toast } from "sonner";
import TypeBadge from "@/components/common/TypeBadge";
import type { Entity, EntityType } from "@/lib/types";

/** ------------------------------------ Types ------------------------------------ */
type FilterType = "all" | EntityType;

type EntityDetails = {
  name: string;
  id: string;
  type: EntityType;
  spocEmail: string;
  baseUrl: string;
  ips: string | number;
};

/** ------------------------ Legacy + Given Mock Data (merged) -------------------- */
const DATA_ROWS: Entity[] = [
  { name: "test Laboratories India Private Limited", id: "test-fip-10", type: "FIP" },
  { name: "FIP-SIMULATOR", id: "FIP-SIMULATOR-09", type: "FIP" },
  { name: "AA-SIMULATOR", id: "AA-SIMULATOR", type: "AA" },
  { name: "FIP-SIMULATOR", id: "FIP-SIMULATOR", type: "FIP" },
  { name: "FIU-SIMULATOR", id: "afpl-FIU", type: "FIU" },
  { name: "Test-simulator", id: "Test-simulator10", type: "FIP" },
  { name: "Test-simulator-updated", id: "Test-simulator", type: "FIP" },
  { name: "FIP-SIMULATOR", id: "FIP-SIMULATOR-21", type: "FIP" },
  { name: "FIP-SIMULATOR", id: "FIP-SIMULATOR5", type: "FIP" },
  { name: "FIU-SIMULATOR", id: "FIU-SIMULATOR", type: "FIU" },
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

// merged & de-duped by id
const INITIAL_ROWS: Entity[] = (() => {
  const map = new Map<string, Entity>();
  DATA_ROWS.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
})();

/** ----------------------------- Fake details per type --------------------------- */
const TYPE_DEFAULTS: Record<EntityType, Omit<EntityDetails, "name" | "id">> = {
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
  const [rows, setRows] = useState<Entity[]>(INITIAL_ROWS);

  // filters
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");
  const [qType, setQType] = useState<FilterType>("all");

  // ui state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<Entity | null>(null);

  // edit form (very small demo)
  const [editForm, setEditForm] = useState<{ name: string; type: EntityType; spocEmail: string; baseUrl: string }>({
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
      const byId = !iq || r.id.toLowerCase().includes(iq);
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

  const cols: DataTableColumn<Entity>[] = useMemo(() => [
    { key: "name", header: "Entity Name", cell: r => r.name, sortBy: "name" },
    { key: "id", header: "Entity ID", cell: r => <span className="font-mono text-sm">{r.id}</span>, sortBy: "id" },
    { key: "type", header: "Type", headClassName: "w-[120px]", cell: r => <TypeBadge type={r.type} />, sortBy: "type" },
    {
      key: "actions",
      header: <span className="block text-center">Actions</span>,
      headClassName: "w-[140px]",
      className: "text-center",
      sortable: false,
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
  ], []);

  const resetFilters = () => {
    setQName("");
    setQId("");
    setQType("all");
  };

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  /** ---------- Actions ---------- */
  const openView = (row: Entity) => {
    setSelected(row);
    setViewOpen(true);
  };

  const openEdit = (row: Entity) => {
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
        r.id === selected.id ? { ...r, name: editForm.name, type: editForm.type } : r
      )
    );
    setEditOpen(false);
  };

  const openDelete = (row: Entity) => {
    setSelected(row);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!selected) return;
    setRows((prev) => prev.filter((r) => r.id !== selected.id));
    setConfirmOpen(false);
  };

  /** ---------- Details (fake) ---------- */
  const details: EntityDetails | null = useMemo(() => {
    if (!selected) return null;
    const d = TYPE_DEFAULTS[selected.type];
    return {
      name: selected.name,
      id: selected.id,
      type: selected.type,
      spocEmail: d.spocEmail,
      baseUrl: d.baseUrl,
      ips: d.ips,
    };
  }, [selected]);

  const copyJson = async (obj: unknown, label: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
      toast.success(`${label} JSON copied`);
    } catch {
      toast.error(`Failed to copy ${label} JSON`);
    }
  };

  const generalJson = details
    ? { name: details.name, id: details.id, type: details.type }
    : null;

  const contactsJson = details
    ? { spocEmail: details.spocEmail, baseUrl: details.baseUrl, ips: details.ips }
    : null;

  return (
    <div className="">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-2xl font-semibold">Central Registry</h1>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <h2 className="text-base font-medium">All Entities</h2>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Browse, filter, sort, edit & export registry entities (AA • FIP • FIU).
        </p>
      </div>

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
          <DataTable<Entity>
            data={filtered}
            columns={cols}
            showIndex
            indexHeader="S.NO"
            startIndex={1}
            exportCsvFilename="CR_All_Entities.csv"
          />
        </Card>
      </div>

      {/* ------------------------- View Dialog (Details) ------------------------- */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-start justify-between relative">
              Entity Information
              <span className="flex justify-end absolute top-0 right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generalJson && contactsJson && copyJson({ ...generalJson, ...contactsJson }, "Complete Entity")}
                  aria-label="Copy Contacts & Network JSON"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy JSON
                </Button>
              </span>
            </DialogTitle>
            <DialogDescription>
              Read-only summary of the selected entity.

            </DialogDescription>
          </DialogHeader>
          {details && (
            <div className="space-y-4">
              <Section title="General Information" className="relative">
                <div className="flex justify-end absolute right-5 top-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generalJson && copyJson(generalJson, "General Information")}
                    aria-label="Copy General Information JSON"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy JSON
                  </Button>
                </div>
                <KV label="Name" value={details.name} />
                <KV label="ID" value={<span className="font-mono">{details.id}</span>} />
                <KV
                  label="Type"
                  value={<TypeBadge type={details.type} />}
                />
              </Section>

              <Section title="Contacts & Network" className="relative">
                <div className="flex justify-end absolute right-5 top-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => contactsJson && copyJson(contactsJson, "Contacts & Network")}
                    aria-label="Copy Contacts & Network JSON"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy JSON
                  </Button>
                </div>
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
                onValueChange={(v) => setEditForm((f) => ({ ...f, type: v as EntityType }))}
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

