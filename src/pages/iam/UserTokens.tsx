// src/pages/iam/user-tokens/UserTokens.tsx
import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  BadgeCheck,
  Clock,
  Search,
  RefreshCcw,
  Download,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import Kpi from "@/components/common/Kpi";
import PageNumbers from "@/components/common/PageNumbers";
import type { DataTableColumn } from "@/components/common/DataTable";
import DataTable from "@/components/common/DataTable";

// ---------------- Types ----------------
type UserToken = {
  userName: string;
  userId: string; // email or identifier
  lastTokenIssued: string; // "YYYY-MM-DD HH:mm:ss"
  tokensIssued: number;
};

// ---------------- Mock Data ----------------
const MOCK_USERS: UserToken[] = [
  { userName: "John Doe", userId: "john.doe@bank.com", lastTokenIssued: "2025-07-10 14:30:15", tokensIssued: 5 },
  { userName: "Jane Smith", userId: "jane.smith@bank.com", lastTokenIssued: "2025-07-09 09:45:22", tokensIssued: 3 },
  { userName: "Mike Johnson", userId: "mike.johnson@bank.com", lastTokenIssued: "2025-07-08 16:20:18", tokensIssued: 8 },
  { userName: "Sarah Wilson", userId: "sarah.wilson@bank.com", lastTokenIssued: "2025-07-07 11:15:45", tokensIssued: 2 },
  { userName: "David Brown", userId: "david.brown@bank.com", lastTokenIssued: "2025-07-06 13:25:30", tokensIssued: 6 },
  { userName: "Emily Davis", userId: "emily.davis@bank.com", lastTokenIssued: "2025-07-05 10:40:12", tokensIssued: 4 },
  { userName: "Robert Miller", userId: "robert.miller@bank.com", lastTokenIssued: "2025-07-04 15:55:33", tokensIssued: 7 },
  { userName: "Lisa Anderson", userId: "lisa.anderson@bank.com", lastTokenIssued: "2025-07-03 12:10:28", tokensIssued: 1 },
  { userName: "Kevin Taylor", userId: "kevin.taylor@bank.com", lastTokenIssued: "2025-07-02 09:35:46", tokensIssued: 9 },
  { userName: "Amanda Moore", userId: "amanda.moore@bank.com", lastTokenIssued: "2025-07-01 14:20:17", tokensIssued: 3 },
  { userName: "Daniel Jackson", userId: "daniel.jackson@bank.com", lastTokenIssued: "2025-06-30 11:45:52", tokensIssued: 5 },
  { userName: "Michelle White", userId: "michelle.white@bank.com", lastTokenIssued: "2025-06-29 16:30:19", tokensIssued: 2 },
  { userName: "Christopher Lee", userId: "christopher.lee@bank.com", lastTokenIssued: "2025-06-28 13:15:41", tokensIssued: 6 },
  { userName: "Jennifer Harris", userId: "jennifer.harris@bank.com", lastTokenIssued: "2025-06-27 10:50:24", tokensIssued: 4 },
  { userName: "Matthew Clark", userId: "matthew.clark@bank.com", lastTokenIssued: "2025-06-26 15:25:38", tokensIssued: 8 },
];

export default function UserTokens() {
  // filters
  const [qName, setQName] = useState("");
  const [qId, setQId] = useState("");

  // pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // reset page when filters/page-size change
  useEffect(() => setPage(1), [qName, qId, rowsPerPage]);

  // filtered rows
  const filtered = useMemo(() => {
    const nameQ = qName.trim().toLowerCase();
    const idQ = qId.trim().toLowerCase();
    return MOCK_USERS.filter((u) => {
      const hitName = !nameQ || u.userName.toLowerCase().includes(nameQ);
      const hitId = !idQ || u.userId.toLowerCase().includes(idQ);
      return hitName && hitId;
    });
  }, [qName, qId]);

  // KPIs
  const kpis = useMemo(() => {
    const totalUsers = filtered.length;
    const highVolume = filtered.filter((u) => u.tokensIssued > 5).length;
    const totalTokens = filtered.reduce((s, u) => s + u.tokensIssued, 0);
    const avg = totalUsers ? Math.round(totalTokens / totalUsers) : 0;
    return { totalUsers, highVolume, totalTokens, avg };
  }, [filtered]);

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
  };

  const downloadCsv = () => {
    const header = [
      "S.NO",
      "User Name",
      "User ID",
      "Last Token Issued",
      "Tokens Issued",
    ];
    const rows = filtered.map((u, i) => [
      String(i + 1),
      u.userName,
      u.userId,
      u.lastTokenIssued,
      String(u.tokensIssued),
    ]);
    const csv = [header, ...rows].map((r) => r.map(safeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "IAM_UserTokens.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const cols: DataTableColumn<UserToken>[] = [
    { key: "user", header: "User Name", cell: r => r.userName },
    { key: "id", header: "User ID", cell: r => <span className="font-mono text-sm">{r.userId}</span> },
    { key: "last", header: "Last Token Issued", headClassName: "w-[240px]", cell: r => r.lastTokenIssued },
    { key: "count", header: "Tokens Issued", headClassName: "w-[160px]", align: "right", cell: r => r.tokensIssued },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl py-6">
        {/* KPI Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Users className="h-9 w-9" />} title="Total Users" value={kpis.totalUsers} tone="indigo" />
          <Kpi icon={<TrendingUp className="h-9 w-9" />} title="High Volume" value={kpis.highVolume} tone="emerald" />
          <Kpi icon={<BadgeCheck className="h-9 w-9" />} title="Total Tokens Issued" value={kpis.totalTokens} tone="sky" />
          <Kpi icon={<Clock className="h-9 w-9" />} title="Avg Tokens/User" value={kpis.avg} tone="amber" />
        </div>

        <Card className="p-4 md:p-5">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Search by user name
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Jane Smith"
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Search by user ID
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. jane.smith@bank.com"
                  value={qId}
                  onChange={(e) => setQId(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex gap-2 md:ml-auto">
              <Button variant="outline" onClick={resetFilters}>Reset</Button>
              <Button variant="outline" onClick={() => {/* hook to real refetch later */ }}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table */}
          <DataTable<UserToken>
            data={pageRows}
            columns={cols}
            showIndex
            startIndex={startIdx}
            emptyMessage="No users match your filters."
          />

          {/* Footer / export + pagination */}
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
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setPage(1)} disabled={page === 1} aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1} aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <PageNumbers page={page} totalPages={totalPages} onChange={setPage} />

                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages} aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Last page"
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

// ---------------- Reusable bits ----------------

function safeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
