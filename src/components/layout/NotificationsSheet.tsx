// src/components/layout/NotificationsSheet.tsx
import * as React from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  Mail,
  ExternalLink,
} from "lucide-react";

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  /** ISO timestamp */
  time: string;
  type?: "info" | "success" | "warning" | "system";
  read?: boolean;
  /** Optional CTA */
  actionLabel?: string;
  actionHref?: string; // internal or external
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: NotificationItem[];
  onItemsChange: (next: NotificationItem[]) => void;
};

export default function NotificationsSheet({
  open,
  onOpenChange,
  items,
}: Props) {
  const [tab, setTab] = React.useState<"unread" | "all">("unread");

  const filtered = React.useMemo(
    () => (tab === "unread" ? items.filter((n) => !n.read) : items),
    [items, tab]
  );

  const unreadCount = React.useMemo(() => items.filter((n) => !n.read).length, [items]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <SheetHeader className="p-0">
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription className="mt-1">
                Coming Soon...
              </SheetDescription>
            </SheetHeader>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <Segmented
            options={[
              { key: "unread", label: `Unread${unreadCount ? ` (${unreadCount})` : ""}` },
              { key: "all", label: "All" },
            ]}
            value={tab}
            onChange={(v) => setTab(v as "unread" | "all")}
          />
        </div>

        {/* List */}
        <div className="max-h-[calc(100vh-220px)] overflow-auto p-2">
          {filtered.length === 0 ? (
            <EmptyList />
          ) : (
            <ul className="space-y-2">
              {filtered.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    !n.read && "bg-muted/40"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <TypeIcon type={n.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate font-medium">{n.title}</div>
                        <div className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(n.time)}
                        </div>
                      </div>
                      {n.description && (
                        <div className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                          {n.description}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {n.actionHref && (
                          <ActionLink href={n.actionHref} label={n.actionLabel ?? "Open"} />
                        )}
                        {!n.read && (
                          <Button variant="ghost" size="sm">
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* --- Internals --- */

function EmptyList() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Bell className="h-8 w-8 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">You’re all caught up.</div>
    </div>
  );
}

function TypeIcon({ type }: { type?: NotificationItem["type"] }) {
  const cls = "h-5 w-5";
  if (type === "warning") return <AlertTriangle className={cls} />;
  if (type === "success") return <CheckCheck className={cls} />;
  if (type === "system") return <Mail className={cls} />;
  return <Info className={cls} />;
}

function ActionLink({ href, label }: { href: string; label: string }) {
  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm underline underline-offset-2 hover:opacity-90"
      >
        {label} <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1 text-sm underline underline-offset-2 hover:opacity-90"
    >
      {label}
    </Link>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="inline-flex rounded-md border p-0.5">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            className={cn(
              "rounded px-2.5 py-1 text-xs",
              active ? "bg-background shadow" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onChange(o.key)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function timeAgo(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
