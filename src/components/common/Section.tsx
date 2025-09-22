import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tight?: boolean; // smaller padding if true
};

export function Section({
  title,
  description,
  icon,
  children,
  className,
  tight,
}: Props) {
  return (
    <div className={cn("rounded-xl border bg-card", tight ? "p-4" : "p-6", className)}>
      {(title || description) && (
        <div className="mb-4 flex items-start gap-2">
          {icon}
          <div>
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}
