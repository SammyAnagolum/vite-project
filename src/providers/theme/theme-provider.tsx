import * as React from "react";
import { ThemeContext, STORAGE_KEY, applyTheme, type Theme } from "./theme-context";

export function ThemeProvider({
  children,
  defaultTheme = "system" as Theme,
}: { children: React.ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme;
    return saved;
  });

  React.useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Listen to OS changes when in "system"
  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
      if (saved === "system") applyTheme("system");
    };
    mql.addEventListener?.("change", listener);
    return () => mql.removeEventListener?.("change", listener);
  }, []);

  const setThemeSafe = React.useCallback((t: Theme) => setTheme(t), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeSafe }}>
      {children}
    </ThemeContext.Provider>
  );
}
