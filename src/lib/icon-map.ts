// src/lib/icon-map.ts
import {
    Landmark,
    CreditCard,
    ShieldCheck,
    ShieldAlert,
    Activity,
    Users,
    RefreshCcw,
    FileBarChart2,
    CheckCircle2,
    Clock,
    XCircle,
    LoaderCircle,
    CalendarClock,
    TriangleAlert,
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
    Reports: FileBarChart2,
    ShieldAlert,
    CalendarClock,
    TriangleAlert,

    // statuses
    Pending: Clock,
    Processing: LoaderCircle,
    Completed: CheckCircle2,
    Failed: XCircle,
} as const;

export type AppIconKey = keyof typeof AppIcons;
