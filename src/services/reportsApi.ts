/* Fake Reports API for Execute & Generated Reports pages
 * Replace with real HTTP calls later. Shapes match what the pages expect.
 */
import { useMemo } from "react";

/** ---------- Types ---------- */
export type GenerateReportBody = {
    dashboard_id: string;
    start_time: string; // ISO
    end_time: string; // ISO
    export_format: "PDF" | "CSV";
};

type DashboardRow = {
    id: string;
    dashboard_id?: string; // tolerance if your real API uses this key
    name: string;
    createdBy: string;
    modifiedAt: string; // display string
};

type GeneratedReq = {
    requestId: string;
    name: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    appliedFilter: string;
    downloadedCount: number;
};

/** ---------- Mock DB (module-scoped to persist across renders) ---------- */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date();

const mockDashboards: DashboardRow[] = [
    {
        id: "db-1001",
        dashboard_id: "db-1001",
        name: "KPI - Token Health",
        createdBy: "ops.bot",
        modifiedAt: "2025-07-10 09:12:44",
    },
    {
        id: "db-1002",
        dashboard_id: "db-1002",
        name: "IAM - Entity Tokens",
        createdBy: "harish",
        modifiedAt: "2025-07-11 17:05:12",
    },
    {
        id: "db-1003",
        dashboard_id: "db-1003",
        name: "IAM - User Tokens",
        createdBy: "sowmya",
        modifiedAt: "2025-07-09 14:37:58",
    },
    {
        id: "db-1004",
        dashboard_id: "db-1004",
        name: "Secret Expiry",
        createdBy: "devops",
        modifiedAt: "2025-07-08 22:01:06",
    },
    {
        id: "db-1005",
        dashboard_id: "db-1005",
        name: "System Audit",
        createdBy: "auditor",
        modifiedAt: "2025-06-30 11:19:21",
    },
    {
        id: "db-1006",
        dashboard_id: "db-1006",
        name: "Traffic Summary",
        createdBy: "ops.bot",
        modifiedAt: "2025-07-12 08:02:09",
    },
    { id: "db-1007", dashboard_id: "db-1007", name: "Error Rates", createdBy: "qa.team", modifiedAt: "2025-07-05 19:45:02" },
    {
        id: "db-1008",
        dashboard_id: "db-1008",
        name: "Consent Requests",
        createdBy: "product",
        modifiedAt: "2025-07-03 10:28:34",
    },
];

let generatedRequests: GeneratedReq[] = [
    {
        requestId: "req-9001",
        name: "Secret Expiry - Weekly",
        status: "COMPLETED",
        appliedFilter: "2025-07-05 00:00:00 - 2025-07-12 00:00:00",
        downloadedCount: 3,
    },
    {
        requestId: "req-9002",
        name: "IAM Tokens - Yesterday",
        status: "PROCESSING",
        appliedFilter: "2025-07-11 00:00:00 - 2025-07-11 23:59:59",
        downloadedCount: 1,
    },
    {
        requestId: "req-9003",
        name: "Audit Log - Q2",
        status: "FAILED",
        appliedFilter: "2025-04-01 00:00:00 - 2025-06-30 23:59:59",
        downloadedCount: 0,
    },
    {
        requestId: "req-9004",
        name: "Traffic Summary - 7d",
        status: "COMPLETED",
        appliedFilter: "2025-07-05 08:00:00 - 2025-07-12 08:00:00",
        downloadedCount: 5,
    },
];

/** Small ID factory */
let reqCounter = 10000;
const nextReqId = () => `req-${reqCounter++}`;

/** Format helper: "YYYY-MM-DD HH:mm:ss" */
function fmt(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
        d.getMinutes()
    )}:${pad(d.getSeconds())}`;
}

/** ---------- Public hook API (same shape used by pages) ---------- */
export function useReportsApi() {
    const fetchDashboards = async (): Promise<{ dashboards: DashboardRow[] }> => {
        await delay(400);
        // clone to simulate network payload
        return { dashboards: JSON.parse(JSON.stringify(mockDashboards)) };
    };

    const fetchGeneratedReports = async (): Promise<{ requests: GeneratedReq[] }> => {
        await delay(400);
        // Optional: bump some downloaded counts randomly to feel “alive”
        generatedRequests = generatedRequests.map((r) =>
            r.status === "COMPLETED" && Math.random() < 0.15 ? { ...r, downloadedCount: r.downloadedCount + 1 } : r
        );
        return { requests: JSON.parse(JSON.stringify(generatedRequests)) };
    };

    const generateReport = async (body: GenerateReportBody): Promise<void> => {
        // Validate minimal fields (fake)
        if (!body.dashboard_id || !body.start_time || !body.end_time) {
            throw new Error("Missing fields for report generation");
        }

        const dash = mockDashboards.find((d) => d.id === body.dashboard_id || d.dashboard_id === body.dashboard_id);
        const name = `${dash?.name ?? "Report"} - ${body.export_format}`;

        // Create a new pending request
        const newReq: GeneratedReq = {
            requestId: nextReqId(),
            name,
            status: "PENDING",
            appliedFilter: `${fmt(new Date(body.start_time))} - ${fmt(new Date(body.end_time))}`,
            downloadedCount: 0,
        };
        generatedRequests = [newReq, ...generatedRequests];

        // Simulate backend processing → PROCESSING → COMPLETED
        // (We don't await these; pages will see updated state on refresh.)
        setTimeout(() => {
            generatedRequests = generatedRequests.map((r) =>
                r.requestId === newReq.requestId ? { ...r, status: "PROCESSING" } : r
            );
        }, 800);

        setTimeout(() => {
            const didFail = Math.random() < 0.08; // small chance to fail
            generatedRequests = generatedRequests.map((r) =>
                r.requestId === newReq.requestId ? { ...r, status: didFail ? "FAILED" : "COMPLETED" } : r
            );
        }, 1800);

        // Simulate POST latency
        await delay(300);
    };

    const downloadReport = async (requestId: string, reportName?: string): Promise<void> => {
        await delay(250);
        const row = generatedRequests.find((r) => r.requestId === requestId);
        if (!row) throw new Error("Report not found");

        // Simulate a PDF blob and start a download
        const content = `Fake PDF report\n\nName: ${reportName ?? row.name}\nRequest ID: ${requestId}\nStatus: ${
            row.status
        }\nFilter: ${row.appliedFilter}\nGenerated at: ${fmt(now())}\n`;
        const blob = new Blob([content], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(reportName ?? row.name).replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        // Update downloaded count
        generatedRequests = generatedRequests.map((r) =>
            r.requestId === requestId ? { ...r, downloadedCount: r.downloadedCount + 1 } : r
        );
    };

    const deleteReport = async (requestId: string): Promise<void> => {
        await delay(250);
        const exists = generatedRequests.some((r) => r.requestId === requestId);
        if (!exists) throw new Error("Report not found");
        generatedRequests = generatedRequests.filter((r) => r.requestId !== requestId);
    };

    // Return stable references (useMemo not strictly necessary but tidy)
    return useMemo(
        () => ({
            fetchDashboards,
            generateReport,
            fetchGeneratedReports,
            downloadReport,
            deleteReport,
        }),
        []
    );
}
