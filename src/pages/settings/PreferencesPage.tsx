import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Monitor, SunMedium, MoonStar, RotateCcw } from "lucide-react";
import { useTheme } from "@/providers/theme/use-theme";
import { toast } from "sonner";

/**
 * Preferences page
 * - Theme: system / light / dark (instant apply via ThemeProvider)
 * - Density: compact toggle (sets html[data-density="compact"])
 *
 * Route from HeaderBar: "/settings"
 */

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();

  // ---- Density (compact) preference ----
  const STORAGE_DENSITY = "pref-density"; // "compact" | "comfortable"
  const [compact, setCompact] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DENSITY);
      return saved ? saved === "compact" : false;
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (compact) {
      root.setAttribute("data-density", "compact");
      localStorage.setItem(STORAGE_DENSITY, "compact");
    } else {
      root.removeAttribute("data-density");
      localStorage.setItem(STORAGE_DENSITY, "comfortable");
    }
  }, [compact]);

  // ---- Reset to defaults ----
  const onReset = () => {
    setTheme("system");
    setCompact(false);
    toast.success("Preferences reset to defaults");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Personalize the console to your liking. Changes are applied instantly.
        </p>
      </div>

      {/* Appearance */}
      <Card className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-medium">Appearance</div>
            <div className="text-sm text-muted-foreground">
              Choose your theme. “System” follows your OS setting.
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <RadioGroup
          value={theme}
          onValueChange={(v: "system" | "light" | "dark") => setTheme(v)}
          className="grid gap-3 sm:grid-cols-3"
        >
          <ThemeCard
            value="system"
            label="System"
            description="Match OS"
            icon={<Monitor className="h-5 w-5" />}
            selected={theme === "system"}
          />
          <ThemeCard
            value="light"
            label="Light"
            description="Bright"
            icon={<SunMedium className="h-5 w-5" />}
            selected={theme === "light"}
          />
          <ThemeCard
            value="dark"
            label="Dark"
            description="Dim"
            icon={<MoonStar className="h-5 w-5" />}
            selected={theme === "dark"}
          />
        </RadioGroup>
      </Card>

      {/* Density */}
      <Card className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-medium">Density</div>
            <div className="text-sm text-muted-foreground">
              Compact reduces paddings in tables and lists.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="compact-switch" className="text-sm">Compact</Label>
            <Switch
              id="compact-switch"
              checked={compact}
              onCheckedChange={setCompact}
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

/** Small presentational card for theme options */
function ThemeCard({
  value,
  label,
  description,
  icon,
  selected,
}: {
  value: "system" | "light" | "dark";
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
}) {
  return (
    <Label
      htmlFor={`theme-${value}`}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ring-1 transition
        ${selected ? "ring-primary" : "ring-border hover:bg-accent/50"}`}
    >
      <RadioGroupItem id={`theme-${value}`} value={value} />
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div>
        <div>
          <div className="text-sm font-medium leading-none">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </Label>
  );
}
