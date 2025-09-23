// src/components/common/TypeIcon.tsx
import { Building2, CreditCard, ShieldCheck } from "lucide-react";

export function TypeIcon({
  type,
  className,
}: {
  type: "AA" | "FIP" | "FIU";
  className?: string;
}) {
  const C = type === "FIP" ? Building2 : type === "FIU" ? CreditCard : ShieldCheck;
  return <C className={className} />;
}
