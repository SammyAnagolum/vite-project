// src/components/common/BrandLogo.tsx
import { LogoHoriz, LogoVert, LogoMark, LogoHorizDark } from "@/lib/brand";
import { useTheme } from "@/providers/theme/use-theme";


type Variant = "horizontal" | "vertical" | "mark";

export default function BrandLogo({
  variant = "horizontal",
  className = "",
  alt = "Sahamati",
}: { variant?: Variant; className?: string; alt?: string }) {
  const { resolved } = useTheme();
  const src =
    variant === "vertical"
      ? LogoVert
      : variant === "mark"
        ? LogoMark
        : resolved === "dark"
          ? LogoHorizDark
          : LogoHoriz;
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
