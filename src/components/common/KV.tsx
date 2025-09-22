import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  children?: React.ReactNode;     // value content
  value?: React.ReactNode;        // optional alt prop
  mono?: boolean;                 // monospace value (IDs/URLs)
  copy?: boolean | string;        // add a small "Copy" action
  className?: string;
};

export function KV({ label, value, children, mono, copy, className }: Props) {
  const content = value ?? children ?? "—";
  const toCopy =
    typeof copy === "string" ? copy : typeof content === "string" ? content : undefined;

  return (
    <div className={cn("grid grid-cols-3 items-start gap-3 py-2", className)}>
      <div className="col-span-1 text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div className="col-span-2 text-sm">
        <div className={cn(mono && "font-mono text-[13px] break-all")}>{content}</div>
        {toCopy && (
          <button
            type="button"
            className="mt-1 text-xs text-primary hover:underline"
            onClick={() => navigator.clipboard.writeText(toCopy)}
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}
