// src/lib/icon-map.ts
import {
    Landmark,
    CreditCard,
    ShieldCheck,
    ShieldAlert,
    Activity,
    Users,
    RefreshCcw,
    CalendarClock,
    TriangleAlert,
    CalendarDays
} from "lucide-react";

export const AppIcons = {
    // entity types
    AA: ShieldCheck,
    FIP: Landmark,
    FIU: CreditCard,

    // generic
    Activity,
    Users,
    RefreshCcw,
    ShieldAlert,
    CalendarClock,
    TriangleAlert,
    CalendarDays,
} as const;

export type AppIconKey = keyof typeof AppIcons;
