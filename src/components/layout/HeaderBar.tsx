// src/components/layout/HeaderBar.tsx
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, HelpCircle, LogOut, Settings, User } from "lucide-react";
import ModeToggle from "../common/ModeToggle";

// NEW: bring in our overlays
import NotificationsSheet, { type NotificationItem } from "./NotificationsSheet";
import HelpDialog from "./HelpDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ACRONYMS: Record<string, string> = { cr: "CR", iam: "IAM" };

function titleCase(slug: string) {
  return slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}
function getCase(part: string): string {
  return ACRONYMS[part.toLowerCase()] ? ACRONYMS[part.toLowerCase()] : titleCase(part);
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-foreground">Home</Link>
      {parts.map((p, idx) => {
        const href = "/" + parts.slice(0, idx + 1).join("/");
        return (
          <React.Fragment key={href}>
            <span className="mx-1">/</span>
            <Link to={href} className="hover:text-foreground">{getCase(p)}</Link>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default function HeaderBar() {
  // wire real user/email via auth context later
  const user = { name: "Admin User", email: "admin@example.com" };
  const initials = React.useMemo(
    () => user.name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase(),
    [user.name]
  );

  // environment label
  const envLabel = import.meta.env.VITE_APP_ENV || "Sandbox";

  // --- NEW: notifications state + overlays ---
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const [notifications, setNotifications] = React.useState<NotificationItem[]>(() => seedNotifications());
  const unreadCount = React.useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Optional: hotkeys (Shift + / opens help)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" || (e.shiftKey && e.key === "/")) setHelpOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      {/* Left: breadcrumbs */}
      <Breadcrumbs />

      <div className="ml-auto" />

      <ModeToggle />

      {/* Environment pill */}
      <span className="hidden rounded-md border px-2 py-1 text-xs text-muted-foreground md:inline">
        {envLabel}
      </span>

      {/* Actions */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setNotifOpen(true)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications (coming soon)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Help"
              onClick={() => setHelpOpen(true)}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Help & Docs (coming soon)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="leading-tight">
            <div className="text-lg font-medium">{user.name}</div>
            <div className="text-base text-muted-foreground">{user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex w-full items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex w-full items-center gap-2">
              <Settings className="h-4 w-4" /> Preferences
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { /* hook sign-out here */ }} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Overlays */}
      <NotificationsSheet
        open={notifOpen}
        onOpenChange={setNotifOpen}
        items={notifications}
        onItemsChange={setNotifications}
      />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
}

function seedNotifications(): NotificationItem[] {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  return [
    {
      id: "n1",
      title: "Coming soon: Smart alerts",
      description: "Get notified about expiring secrets, report completions, and anomalies.",
      time: iso(6 * 60 * 60 * 1000),
      type: "system",
      read: false,
      actionLabel: "Learn more",
      actionHref: "/changelog",
    },
    {
      id: "n2",
      title: "Welcome to the new console",
      description: "We’ve refreshed the UI. Let us know what you think!",
      time: iso(3 * 24 * 60 * 60 * 1000),
      type: "system",
      read: true,
      actionLabel: "What’s new",
      actionHref: "/changelog",
    },
  ];
}
