// src/pages/iam/user-tokens/UserTokens.tsx
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  TrendingUp,
  BadgeCheck,
  Clock,
  Search,
  RefreshCcw,
  HelpCircle,
} from "lucide-react";
import Kpi from "@/components/common/Kpi";
import type { DataTableColumn } from "@/components/common/data-table/types";
import DataTable from "@/components/common/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const cols: DataTableColumn<UserToken>[] = useMemo(() => [
    { key: "user", header: "User Name", cell: r => r.userName, sortBy: "userName" },
    { key: "id", header: "User ID", cell: r => <span className="font-mono text-sm">{r.userId}</span>, sortBy: "userId", exportValue: r => r.userId },
    { key: "last", header: "Last Token Issued", headClassName: "w-[240px]", cell: r => r.lastTokenIssued, sortBy: "lastTokenIssued", exportValue: r => r.lastTokenIssued },
    { key: "count", header: "Tokens Issued", headClassName: "w-[160px]", align: "right", cell: r => r.tokensIssued, sortBy: "tokensIssued" },
  ], []);

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

  const resetFilters = () => {
    setQName("");
    setQId("");
  };

  return (
    <div className="">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-2xl font-semibold">IAM</h1>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-medium">User Tokens</h2>
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
                Browse and search issued user tokens, check status and last activity, take actions (e.g., revoke), and export CSV.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

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
            data={filtered}
            columns={cols}
            showIndex
            startIndex={1}
            emptyMessage="No users match your filters."
            getRowKey={(r) => r.userId}
            exportCsvFilename="IAM_UserTokens.csv"
            initialSort={{ key: "user", direction: "asc" }}
          />
        </Card>
      </div>
    </div>
  );
}