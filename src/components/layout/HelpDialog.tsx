// src/components/layout/HelpDialog.tsx
import * as React from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, Keyboard, MessageSquare, Sparkles, ExternalLink } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function HelpDialog({ open, onOpenChange }: Props) {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com";
  const version = import.meta.env.VITE_APP_VERSION || "v0.1.0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Help & Shortcuts</DialogTitle>
          <DialogDescription>Quick links, docs, and handy keyboard tips.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Quick cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <CardLink
              to="https://example.com/docs"
              external
              icon={<BookOpen className="h-5 w-5" />}
              title="Documentation"
              desc="Guides and API references."
            />
            <CardLink
              to="/changelog"
              icon={<Sparkles className="h-5 w-5" />}
              title="What’s new"
              desc="Recent updates and fixes."
            />
          </div>

          {/* Shortcuts */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Keyboard shortcuts</div>
            </div>
            <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              <Shortcut k="⌘K / Ctrl K" label="Quick search" />
              <Shortcut k="?" label="Open this help" />
              <Shortcut k="g p" label="Go to Preferences" />
              <Shortcut k="g n" label="Open Notifications" />
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Contact support</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Found a bug or need help? Email{" "}
              <a className="underline underline-offset-2" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
              .
            </p>
          </div>

          <div className="text-xs text-muted-foreground">App version: {version}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CardLink({
  to,
  external,
  icon,
  title,
  desc,
}: {
  to: string;
  external?: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const content = (
    <div className="flex h-full items-start gap-3 rounded-lg border p-3 hover:bg-muted/60">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      {external && <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />}
    </div>
  );
  return external ? (
    <a href={to} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <Link to={to}>{content}</Link>
  );
}

function Shortcut({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-muted/40">
      <span>{label}</span>
      <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px]">{k}</kbd>
    </div>
  );
}
