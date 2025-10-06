import * as React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Monitor, SunMedium, MoonStar } from "lucide-react";
import { useTheme } from "@/providers/theme/use-theme";

/**
 * Preferences page
 * - Theme: system / light / dark (instant apply via ThemeProvider)
 *
 * Route from HeaderBar: "/settings"
 */

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();

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
