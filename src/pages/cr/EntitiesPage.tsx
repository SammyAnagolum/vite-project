// src/pages/cr/EntitiesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Eye, PencilLine, Trash2, Copy, Maximize2, Minimize2, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Section } from "@/components/common/Section";
import { KV } from "@/components/common/KV";
import Kpi from "@/components/common/Kpi";
import { AppIcons } from "@/lib/icon-map";
import type { DataTableColumn } from "@/components/common/data-table/types";
import DataTable from "@/components/common/DataTable";
import { toast } from "sonner";
import TypeBadge from "@/components/common/TypeBadge";
import type { Entity, EntityType } from "@/lib/types";
import {
  fetchAllEntities,
  fetchEntityDetails,
  updateEntity,
  type EntityDetails as ServerEntityDetails,
} from "@/services/crApi";
import { extractErrorMessage } from "@/lib/http";

/** ------------------------------------ Types ------------------------------------ */
type FilterType = "all" | EntityType;

type EntityDetails = {
  name: string;
  id: string;
  type: EntityType;
  spocEmail?: string;
  baseUrl?: string;
  ips?: string | number | string[];
};

/** ------------------------------------ Page ------------------------------------ */
export default function EntitiesPage() {
  // data
  const [rows, setRows] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

  // view/edit details
  const [details, setDetails] = useState<EntityDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // edit form
  const [editForm, setEditForm] = useState<{ name: string; type: EntityType; spocEmail?: string; baseUrl?: string }>({
    name: "",
    type: "FIP",
    spocEmail: "",
    baseUrl: "",
  });

  // Focus mode (hide header/KPIs; keep toggle visible)
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // initial fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setErr(null);
        const list = await fetchAllEntities();
        if (!mounted) return;
        setRows(
          // ensure unique by id
          Array.from(new Map(list.map((e) => [e.id, e])).values())
        );
      } catch (e) {
        setErr(extractErrorMessage(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  const exportInfo = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    if (qName.trim()) items.push({ label: "Name contains", value: qName.trim() });
    if (qId.trim()) items.push({ label: "Entity ID contains", value: qId.trim() });
    items.push({ label: "Type", value: qType === "all" ? "All" : qType });

    items.push({ label: "Rows (filtered)", value: String(filtered.length) });
    items.push({
      label: "Exported At",
      value: new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date()),
    });
    return items;
  }, [qName, qId, qType, filtered.length]);

  // stats
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:text-muted-foreground" onClick={() => openEdit(r)} aria-label="Edit" disabled>
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 disabled:text-muted-foreground" onClick={() => openDelete(r)} aria-label="Delete" disabled>
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

  const refetch = async () => {
    try {
      setIsRefreshing(true);
      const list = await fetchAllEntities();
      setRows(Array.from(new Map(list.map((e) => [e.id, e])).values()));
      toast.success("Entities refreshed");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setIsRefreshing(false);
    }
  };

  /** ---------- Actions ---------- */
  const openView = async (row: Entity) => {
    setSelected(row);
    setViewOpen(true);
    setDetails(null);
    try {
      setDetailsLoading(true);
      const d = await fetchEntityDetails(row.id);
      setDetails(d as ServerEntityDetails);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEdit = async (row: Entity) => {
    setSelected(row);
    setEditOpen(true);
    // prefill from details endpoint if available, else minimal
    try {
      const d = await fetchEntityDetails(row.id);
      setEditForm({
        name: row.name,
        type: row.type,
        spocEmail: d.spocEmail ?? "",
        baseUrl: d.baseUrl ?? "",
      });
    } catch {
      setEditForm({ name: row.name, type: row.type, spocEmail: "", baseUrl: "" });
    }
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      await updateEntity(selected.id, editForm.type, {
        name: editForm.name,
        spocEmail: editForm.spocEmail,
        baseUrl: editForm.baseUrl,
      });
      // reflect minimal changes in the list
      setRows(prev =>
        prev.map(r =>
          r.id === selected.id ? { ...r, name: editForm.name, type: editForm.type } : r
        )
      );
      toast.success("Entity updated");
      setEditOpen(false);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const openDelete = (row: Entity) => {
    setSelected(row);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    // No delete API was provided; keep this local-only demo
    if (!selected) return;
    setRows((prev) => prev.filter((r) => r.id !== selected.id));
    setConfirmOpen(false);
    toast.success("Entity removed (local)");
  };

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
    <div className="h-full min-h-0 flex flex-col">
      {/* Header + subtitle (hidden in focus mode) */}
      {!focusMode && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-2xl font-semibold">Central Registry</h1>
          <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-medium">All Entities</h2>
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
                  Browse, filter, sort, edit & export registry entities (AA • FIP • FIU).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="h-full min-h-0 py-4 flex flex-col">
        {/* KPI cards (hidden in focus mode) */}
        {!focusMode && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Total (filtered)" value={stats.total.toLocaleString()} icon={<AppIcons.Users className="h-9 w-9" />} />
            <Kpi title="AA" value={stats.byAA.toLocaleString()} tone="emerald" icon={<AppIcons.AA className="h-9 w-9" />} />
            <Kpi title="FIP" value={stats.byFIP.toLocaleString()} tone="indigo" icon={<AppIcons.FIP className="h-9 w-9" />} />
            <Kpi title="FIU" value={stats.byFIU.toLocaleString()} tone="sky" icon={<AppIcons.FIU className="h-9 w-9" />} />
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
              <Button variant="outline" onClick={refetch} disabled={isRefreshing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <DataTable<Entity>
            data={filtered}
            columns={cols}
            className="flex-1 min-h-0 w-full"
            containerClassName="flex-1 min-h-0 w-full"
            showIndex
            indexHeader="S.NO"
            startIndex={1}
            loading={loading}
            error={err}
            exportCsvFilename="CR_All_Entities.csv"
            exportExcelFilename="CR_ALL_Entities.xlsx"
            exportInfo={exportInfo}
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
                  disabled={!details}
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

          {!details || detailsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading details…</div>
          ) : (
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
                <KV label="Type" value={<TypeBadge type={details.type} />} />
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
                <KV label="SPOC email" value={details.spocEmail ? <a className="text-primary underline-offset-2 hover:underline" href={`mailto:${details.spocEmail}`}>{details.spocEmail}</a> : "—"} />
                <KV label="Base URL" value={details.baseUrl ? <span className="font-mono break-all">{details.baseUrl}</span> : "—"} />
                <KV label="IPs" value={Array.isArray(details.ips) ? details.ips.join(", ") : (details.ips ?? "—")} />
              </Section>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------- Edit Dialog -------------------------- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Entity</DialogTitle>
            <DialogDescription>
              Update basic properties. Changes are sent to the server.
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
                value={editForm.spocEmail ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, spocEmail: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Base URL</label>
              <Input
                value={editForm.baseUrl ?? ""}
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

