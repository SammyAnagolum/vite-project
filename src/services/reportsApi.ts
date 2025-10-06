// src/services/reportsApi.ts
import { useMemo } from "react";
import { api } from "@/lib/http";

/** ---------- Types the pages use ---------- */
export type GenerateReportBody = {
    dashboard_id: string;
    start_time: string; // The page sends ISO; we convert to API format in this module
    end_time: string; // The page sends ISO; we convert to API format in this module
    export_format: "PDF" | "CSV";
    user_id?: string; // optional (old client sometimes sent it)
};

export type DashboardRow = {
    /** Friendly fields the Execute Reports page expects */
    id: string;
    dashboard_id: string;
    name: string; // mapped from title
    createdBy: string; // mapped from created_by
    modifiedAt: string; // formatted from updated_at (fallback created_at)
};

export type DashboardsResponse = {
    dashboards: DashboardRow[];
};

export type GeneratedReq = {
    requestId: string;
    name: string; // derived from dashboard title if backend doesn't provide
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | string;
    appliedFilter: string; // "YYYY-MM-DD HH:mm:ss - YYYY-MM-DD HH:mm:ss"
    downloadedCount: number; // from meta_data if available
};

export type GeneratedReportsResponse = {
    requests: GeneratedReq[];
};

/** ---------- Utils ---------- */

/** API wants: "YYYY-MM-DD HH:mm:ss.000000" (UTC); page gives ISO. */
function isoToApiTimestamp(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso; // fall back (server may still accept)
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    const MM = pad(d.getUTCMonth() + 1);
    const dd = pad(d.getUTCDate());
    const hh = pad(d.getUTCHours());
    const mm = pad(d.getUTCMinutes());
    const ss = pad(d.getUTCSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}.000000`;
}

/** Display helper: "YYYY-MM-DD HH:mm:ss" (local). */
function toDisplayLocal(input: unknown): string {
    if (!input) return "—";
    const d = new Date(String(input));
    if (Number.isNaN(d.getTime())) return String(input);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

/** Safe filename for downloads. */
function sanitizeFilename(name?: string): string {
    if (!name) return "Report";
    let s = name.replace(/[^a-zA-Z0-9-_]/g, "-");
    s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");
    return s || "Report";
}

/** ---------- Public API (stable refs via useMemo) ---------- */
export function useReportsApi() {
    const fetchDashboards = async (): Promise<DashboardsResponse> => {
        // Legacy client used: POST /api/reports/dashboards {}
        // Our axios base already prefixes /api, so just:
        const res = await api.post(`/reports/dashboards`, {});
        const raw = Array.isArray(res.data?.dashboards)
            ? res.data.dashboards
            : Array.isArray(res.data) // tolerate plain array
            ? res.data
            : [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dashboards: DashboardRow[] = raw.map((d: any) => {
            const id = String(d.dashboard_id ?? d.dashboardId ?? d.id ?? "");
            return {
                id,
                dashboard_id: id,
                name: String(d.title ?? d.name ?? "Untitled"),
                createdBy: String(d.created_by ?? d.createdBy ?? d.owner ?? "—"),
                modifiedAt: toDisplayLocal(d.updated_at ?? d.modifiedAt ?? d.updatedAt ?? d.created_at ?? ""),
            };
        });

        return { dashboards };
    };

    const generateReport = async (body: GenerateReportBody) => {
        // Old endpoint: POST /api/reports/dashboards/submit/request
        // Convert times to server format if page sent ISO
        const payload = {
            dashboard_id: body.dashboard_id,
            start_time: body.start_time.includes("T") ? isoToApiTimestamp(body.start_time) : body.start_time,
            end_time: body.end_time.includes("T") ? isoToApiTimestamp(body.end_time) : body.end_time,
            export_format: body.export_format,
            ...(body.user_id ? { user_id: body.user_id } : {}),
        };

        const res = await api.post(`/reports/dashboards/submit/request`, payload, {
            headers: { "Content-Type": "application/json" },
        });
        return res.data as {
            request_id: string;
            dashboard_id: string;
            status: string;
            created_at: string;
        };
    };

    const fetchGeneratedReports = async (): Promise<GeneratedReportsResponse> => {
        // Old endpoint: POST /api/reports/generated-reports { filters: {} }
        const res = await api.post(
            `/reports/generated-reports`,
            { filters: {} },
            { headers: { "Content-Type": "application/json" } }
        );

        const raw = Array.isArray(res.data?.requests) ? res.data.requests : Array.isArray(res.data) ? res.data : [];

        const requests: GeneratedReq[] = raw
            .filter((r: any) => r?.status !== "RETIRED") // eslint-disable-line @typescript-eslint/no-explicit-any

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((r: any) => {
                // Prefer dashboard title if present on server; otherwise craft a label
                const title =
                    r.dashboard_title ??
                    r.dashboardName ??
                    (r.dashboard_id
                        ? `Dashboard ${String(r.dashboard_id).slice(0, 8)}`
                        : `Report ${String(r.request_id).slice(0, 8)}`);

                // Applied filter as a readable range if start/end present
                let appliedFilter = "{}";
                if (r.start_time && r.end_time) {
                    const start = toDisplayLocal(r.start_time);
                    const end = toDisplayLocal(r.end_time);
                    appliedFilter = `${start} - ${end}`;
                }

                // Download count from meta_data if available
                const downloadedCount = Number(r.meta_data?.downloadCount ?? 0);

                return {
                    requestId: String(r.request_id ?? r.id ?? ""),
                    name: String(title),
                    status: String(r.status ?? "PENDING"),
                    appliedFilter,
                    downloadedCount,
                };
            });

        return { requests };
    };

    const downloadReport = async (requestId: string, reportName?: string): Promise<void> => {
        // Old endpoint: GET /api/reports/download/{request_id} (PDF)
        const res = await api.get(`/reports/download/${encodeURIComponent(requestId)}`, {
            responseType: "blob" as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            headers: { "Content-Type": "application/json" },
        });

        const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "application/pdf" });

        // Filename: <sanitizedName>-YYYY-MM-DD_HH-mm-ss.pdf
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(
            now.getMinutes()
        )}-${pad(now.getSeconds())}`;
        const base = sanitizeFilename(reportName) || "Report";
        const filename = `${base}-${stamp}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const deleteReport = async (requestId: string) => {
        // Old endpoint: DELETE /api/reports/delete/{request_id}
        const res = await api.delete(`/reports/delete/${encodeURIComponent(requestId)}`, {
            headers: { "Content-Type": "application/json" },
        });
        return res.data as { request_id: string; status: string; message: string };
    };

    // Stable references for consumers
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
