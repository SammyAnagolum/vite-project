import { type ComponentType } from "react";
import { Database, Shield, FileText, KeySquare, AlertTriangle } from "lucide-react";

export type NavNode = {
    id: string;
    title: string;
    path?: string; // leaf link
    icon?: ComponentType<{ className?: string }>;
    children?: NavNode[]; // group
};

export const NAV: NavNode[] = [
    {
        id: "cr",
        title: "Central Registry",
        icon: Database,
        children: [
            { id: "cr-entities", title: "All Entities", path: "/cr/entities" },
            { id: "cr-telemetry", title: "Metadata Fetch Usage", path: "/cr/telemetry" },
        ],
    },
    {
        id: "iam",
        title: "IAM",
        icon: Shield,
        children: [
            {
                id: "iam-secret-expiry",
                title: "Secret Expiry",
                icon: AlertTriangle,
                children: [{ id: "iam-secret-expiry-details", title: "Expiry Details", path: "/iam/secret-expiry/details" }],
            },
            {
                id: "iam-entity-tokens",
                title: "Entity Tokens",
                icon: KeySquare,
                children: [
                    { id: "iam-entity-tokens-refresh-rate", title: "Refresh Rate", path: "/iam/entity-tokens/refresh-rate" },
                ],
            },
        ],
    },
    {
        id: "reports",
        title: "Reports",
        icon: FileText,
        children: [
            { id: "reports-execute-reports", title: "Execute Reports", path: "/reports/execute-reports" },
            { id: "reports-generated-reports", title: "Generated Reports", path: "/reports/generated-reports" },
        ],
    },
];
