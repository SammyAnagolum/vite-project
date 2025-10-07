// src/components/common/TypeIcon.tsx
import type { EntityType } from "@/lib/types";
import { Building2, CreditCard, ShieldCheck } from "lucide-react";

export function TypeIcon({
  type,
  className,
}: {
  type: EntityType;
  className?: string;
}) {
  const C = type === "FIP" ? Building2 : type === "FIU" ? CreditCard : ShieldCheck;
  return <C className={className} />;
}
