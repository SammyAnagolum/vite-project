// src/components/common/BrandLogo.tsx
import { LogoHoriz, LogoVert, LogoMark } from "@/lib/brand";

type Variant = "horizontal" | "vertical" | "mark";

export default function BrandLogo({
  variant = "horizontal",
  className = "",
  alt = "Sahamati",
}: { variant?: Variant; className?: string; alt?: string }) {
  const src = variant === "vertical" ? LogoVert : variant === "mark" ? LogoMark : LogoHoriz;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}
