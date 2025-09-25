import * as React from "react";
import { ThemeContext, STORAGE_KEY, applyTheme, type Theme, type ResolvedTheme } from "./theme-context";

function getResolved(t: Theme): ResolvedTheme {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return t === "dark" || (t === "system" && systemDark) ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system" as Theme,
}: { children: React.ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme;
    return saved;
  });

  const [resolved, setResolved] = React.useState<ResolvedTheme>(() =>
    getResolved(((localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme))
  );

  React.useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    setResolved(getResolved(theme))
  }, [theme]);

  // Listen to OS changes when in "system"
  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
      if (saved === "system") {
        applyTheme("system")
        setResolved(getResolved("system")); // ← update resolved so consumers re-render
      };
    };
    mql.addEventListener?.("change", listener);
    return () => mql.removeEventListener?.("change", listener);
  }, []);

  const setThemeSafe = React.useCallback((t: Theme) => setTheme(t), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeSafe, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
