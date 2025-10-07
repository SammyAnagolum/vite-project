// src/pages/Changelog.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, GitCommit, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

type ChangeItem = {
  date: string;           // YYYY-MM-DD
  title: string;
  tags?: string[];
  bullets: string[];
  links?: { label: string; to: string }[];
};

const CHANGES: ChangeItem[] = [
  {
    date: "2025-10-06",
    title: "Header polish & scaffolds",
    tags: ["UI", "Navigation"],
    bullets: [
      "Notifications: added sheet with seed 'coming soon' messages; unread dot indicator.",
      "Help: lightweight dialog + hotkey (Shift + /).",
      "Environment pill shown from Vite env (e.g., Sandbox).",
    ],
    links: [
      { label: "What’s new (this page)", to: "/changelog" },
    ],
  },
  {
    date: "2025-10-03",
    title: "Reports — Execute & Generated wired to real APIs",
    tags: ["Reports", "API"],
    bullets: [
      "Execute Reports: fetch dashboards, quick ranges & custom absolute time, submit report generation (PDF).",
      "Generated Reports: list requests, status chips (PENDING/PROCESSING/COMPLETED/FAILED), download & delete actions.",
      "API layer uses `/api/reports/*` endpoints (list, submit, generated, download, delete) with better error toasts.",
      "Kept filenames safe on download (sanitized + timestamp).",
    ],
    links: [
      { label: "Execute Reports", to: "/reports/execute-reports" },
      { label: "Generated Reports", to: "/reports/generated-reports" },
    ],
  },
  {
    date: "2025-10-02",
    title: "IAM — Refresh Rate parity + CR merge",
    tags: ["IAM", "Telemetry"],
    bullets: [
      "Refresh Rate page backed by `/api/token/data/query`.",
      "Merged entity metadata from `api/cr/entityinfo` to normalize names/types and include zero-count CR entities.",
      "Drill-in view per entity with per-day breakdown.",
      "KPI cards added: Issued, Not Issued, Total tokens; ‘Inactive (24h+)’ and ‘High Volume (>5)’ counts.",
      "Robust parsing: handles `__time`, `tokens_issued`, `tokens_not_issued`, and `last_token_time` (IST normalization).",
    ],
    links: [{ label: "IAM – Refresh Rate", to: "/iam/refresh-rate" }],
  },
  {
    date: "2025-10-01",
    title: "IAM — Secret Expiry improvements",
    tags: ["IAM", "Security"],
    bullets: [
      "Normalized assorted expiry fields to IST `YYYY-MM-DD HH:mm:ss`.",
      "KPI cards: Already Expired, Expiring Today, Expiring in ≤ 10 days, and Most Expired Type.",
      "“Expiring Today” counts items whose day-difference to now is exactly 0 (whole-day check).",
      "Safer type inference + coalescing across legacy keys (e.g., `expiry`, `expiry_datetime`, `secret_expiry`).",
    ],
    links: [{ label: "Secret Expiry", to: "/iam/secret-expiry/details" }],
  },
  {
    date: "2025-09-28",
    title: "Client rebuild foundation",
    tags: ["Stack", "Design System"],
    bullets: [
      "New SPA stack: Vite + React 18 + TypeScript 5.",
      "Design system: Tailwind v4 + shadcn/ui (Radix), icons via lucide-react.",
      "Common table & data primitives; toasts via sonner.",
      "HTTP wrapper + error extraction; environment-aware base URL.",
      "Project structure simplified: `components/ui`, `components/common`, `services`, `pages`.",
    ],
    links: [{ label: "Tech rationale & migration plan", to: "/changelog" }],
  },
];

export default function ChangelogPage() {
  return (
    <div className="">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-2xl font-semibold">What’s New</h1>
        <span className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-medium">Changelog</h2>
          <span className="text-xs text-muted-foreground">(since the legacy UI)</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl py-6 space-y-4">
        {CHANGES.map((entry) => (
          <Card key={entry.date} className="p-4 md:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{entry.date}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {entry.tags?.map((t) => (
                  <span className="rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>

            <div className="mt-2">
              <div className="text-base font-semibold">{entry.title}</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {entry.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>

              {entry.links && entry.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.links.map((l) => (
                    <Button key={l.to} variant="outline" size="sm" asChild>
                      <Link to={l.to}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        {l.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}

        <Card className="p-4 md:p-5">
          <div className="mb-1 flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-muted-foreground" />
            <div className="text-base font-semibold">Coming soon</div>
          </div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Global search bar (entities, reports, routes).</li>
            <li>Live notifications (report-ready, expiry alerts, telemetry anomalies).</li>
            <li>More IAM dashboards (user tokens, failure drilling) and CR telemetry.</li>
            <li>Dark mode + additional accessibility passes.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
