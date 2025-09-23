import * as React from "react";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  label: string;
  children?: React.ReactNode;      // value content
  value?: React.ReactNode;         // optional alt prop
  mono?: boolean;                  // monospace value (IDs/URLs)
  /**
   * Copy behavior (default: copy rendered text):
   *  - string: copy this exact string
   *  - true/undefined: copy the rendered text via ref (works for badges/links/spans)
   *  - false: hide the copy icon
   */
  copy?: boolean | string;
  className?: string;
};

export function KV({ label, value, children, mono, copy, className }: Props) {
  const content = value ?? children ?? "—";
  const [copied, setCopied] = React.useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);

  async function handleCopy() {
    try {
      // Decide what to copy:
      const raw =
        typeof copy === "string"
          ? copy
          : typeof content === "string"
            ? content
            : (textRef.current?.innerText ?? "");

      // Normalize whitespace a bit
      const text = raw.replace(/\s+\n/g, "\n").replace(/\s{2,}/g, " ").trim();

      if (!text) {
        toast.error("Nothing to copy");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Failed to copy");
    }
  }

  // show icon unless explicitly disabled
  const showCopy = copy !== false;

  return (
    <div className={cn("grid grid-cols-4 items-start gap-3 py-1", className)}>
      <div className="col-span-1 text-sm font-medium text-muted-foreground">
        {label}
      </div>

      <div className="col-span-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div
            ref={textRef}
            className={cn("min-w-0 break-words", mono && "font-mono text-[13px] break-all")}
          >
            {content}
          </div>

          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              title="Copy"
              className={cn(
                "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
