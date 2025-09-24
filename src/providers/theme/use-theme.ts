import * as React from "react";
import { ThemeContext, type ThemeCtx } from "./theme-context";

export function useTheme(): ThemeCtx {
    const ctx = React.useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
