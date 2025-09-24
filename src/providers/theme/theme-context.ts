import * as React from "react";

export type Theme = "light" | "dark" | "system";

export type ThemeCtx = {
    theme: Theme;
    setTheme: (t: Theme) => void;
};

export const ThemeContext = React.createContext<ThemeCtx | undefined>(undefined);

export const STORAGE_KEY = "pref-theme";

export function applyTheme(theme: Theme) {
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && systemDark);

    root.classList.toggle("dark", isDark);
    root.setAttribute("data-theme", isDark ? "dark" : "light");
}
