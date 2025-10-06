// src/services/crApi.ts
import { api } from "@/lib/http";
import type { EntityType } from "@/lib/types";

/** Server ⇒ UI mapping */
export type EntityListItem = {
  name: string;
  id: string;
  type: EntityType; // "AA" | "FIP" | "FIU"
};

export type EntityDetails = {
  name: string;
  id: string;
  type: EntityType;
  spocEmail?: string;
  baseUrl?: string;
  ips?: string | number | string[];
};

function toEntityType(v: unknown): EntityType {
  const s = String(v ?? "").toUpperCase();
  if (s === "AA" || s === "FIP" || s === "FIU") return s;
  return "FIP"; // fallback
}

function coalesce<T>(...vals: T[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapListItem(row: any): EntityListItem {
  // The API returns wrapper objects: { requester, entityinfo, ... }
  const ei = row?.entityinfo ?? row;

  const name = coalesce<string>(ei?.name, row?.requester?.name, row?.entity_name, row?.entityName) ?? "Unknown";

  const id = coalesce<string>(ei?.id, row?.requester?.id, row?.entity_id, row?.entityId) ?? "unknown-id";

  const type = toEntityType(coalesce(ei?.type, row?.entity_type, row?.type));

  return { name, id, type };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDetails(row: any): EntityDetails {
  const ei = row?.entityinfo ?? row;

  const name = coalesce<string>(ei?.name, row?.requester?.name, row?.entity_name, row?.entityName) ?? "Unknown";

  const id = coalesce<string>(ei?.id, row?.requester?.id, row?.entity_id, row?.entityId) ?? "unknown-id";

  const type = toEntityType(coalesce(ei?.type, row?.entity_type, row?.type));

  // Handle various key casings the backend might use
  const spocEmail = coalesce<string>(ei?.spocEmail, ei?.spoc_email, ei?.contactEmail, ei?.contact_email);

  const baseUrl = coalesce<string>(
    ei?.baseUrl,
    ei?.base_url,
    ei?.baseurl, // note: backend uses "baseurl"
    ei?.endpoint
  );

  const ips = coalesce(ei?.ips, ei?.ip_list, ei?.ipList);

  return { name, id, type, spocEmail, baseUrl, ips };
}

// GET /api/cr/entityinfo
export async function fetchAllEntities(): Promise<EntityListItem[]> {
  const res = await api.get(`/cr/entityinfo`);
  const arr = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return arr.map(mapListItem);
}

// GET /api/cr/entityinfo/:entityId
export async function fetchEntityDetails(entityId: string): Promise<EntityDetails> {
  const res = await api.get(`/cr/entityinfo/${encodeURIComponent(entityId)}`);
  // details could be a wrapper or plain entityinfo; mapDetails handles both
  const data = Array.isArray(res.data) ? res.data[0] : res.data;
  return mapDetails(data ?? {});
}

// PUT /api/update/cr/entityinfo/:entityType  { entity_id, entityinfo }
export async function updateEntity(entityId: string, entityType: EntityType, entityinfo: Record<string, unknown>) {
  const res = await api.put(`/update/cr/entityinfo/${entityType}`, { entity_id: entityId, entityinfo });
  return res.data;
}

/** ---------------------------------------------------------------------------
 * CR Telemetry
 * Endpoint (legacy client): POST /api/cr/telemetry {}
 * Our baseURL already includes /api, so we POST `/cr/telemetry`.
 * Server query (from app-config) returns per-day rows with:
 *   __time (yyyy-MM-dd), entity_name, entity_id, call_count, last_fetch_time (yyyy-MM-dd HH:mm:ss)
 * We normalize to a stable shape and offer helpers to aggregate.
 * --------------------------------------------------------------------------- */
export type CrTelemetryRow = {
  /** yyyy-MM-dd */
  date: string;
  entity_id: string;
  entity_name?: string;
  call_count: number;
  /** yyyy-MM-dd HH:mm:ss (optional) */
  last_fetch_time?: string;
};

// permissive coalesce util
function c<T>(...vals: T[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null && (typeof v !== "string" || v !== "")) return v;
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTelemetryRow(row: any): CrTelemetryRow {
  // time key may arrive as "__time" | "date" | "time" | "timestamp" (already day-formatted)
  const date = String(c(row?.__time, row?.date, row?.time, row?.timestamp) ?? "").slice(0, 10); // yyyy-MM-dd only

  const entity_id = String(c(row?.entity_id, row?.entityId, row?.requester?.id, row?.entityinfo?.id) ?? "");

  const entity_name = c<string>(row?.entity_name, row?.entityName, row?.requester?.name, row?.entityinfo?.name);

  const call_countNum = Number(c(row?.call_count, row?.count, row?.fetch_count, row?.calls));

  const last_fetch_time = c<string>(row?.last_fetch_time, row?.lastFetchTime, row?.recent_fetch_time);

  return {
    date,
    entity_id: entity_id || "unknown-id",
    entity_name,
    call_count: Number.isFinite(call_countNum) ? call_countNum : 0,
    last_fetch_time,
  };
}

/** POST /cr/telemetry  -> CrTelemetryRow[] */
export async function fetchCRTelemetry(): Promise<CrTelemetryRow[]> {
  const res = await api.post(`/cr/telemetry`, {}); // server expects POST {}
  const arr = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return arr.map(mapTelemetryRow);
}

/** Build a quick lookup by entity id for (latest) recent date. */
export function computeLastByEntity(rows: CrTelemetryRow[]): Record<string, string> {
  const last: Record<string, string> = {};
  for (const r of rows) {
    if (!r.entity_id || !r.date) continue;
    // prefer explicit last_fetch_time if provided, fallback to r.date
    const candidate = r.last_fetch_time?.slice(0, 10) ?? r.date; // compare on yyyy-MM-dd
    if (!last[r.entity_id] || last[r.entity_id] < candidate) {
      last[r.entity_id] = candidate;
    }
  }
  return last;
}

/** Try to infer type from a best-effort name hint; if not possible, fallback to "FIP". */
export function inferEntityTypeFromName(name?: string): EntityType {
  const s = String(name ?? "").toUpperCase();
  if (/\bAA\b/.test(s) || s.includes("AA-")) return "AA";
  if (/\bFIU\b/.test(s) || s.includes("FIU-")) return "FIU";
  return "FIP";
}
