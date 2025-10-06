// src/services/iamApi.ts
import { api } from "@/lib/http";
import type { EntityType } from "@/lib/types";

/** ---------- Types exposed to the UI ---------- */
export type SecretExpiryItem = {
  name: string;
  id: string;
  type: EntityType; // "AA" | "FIP" | "FIU"
  /** IST local string "YYYY-MM-DD HH:mm:ss" or null if not available */
  expiryAt: string | null;
};

/** ---------- Helpers (coalesce + type inference + time formatting) ---------- */
function c<T>(...vals: T[]): T | undefined {
  for (const v of vals) {
    if (v !== undefined && v !== null && (typeof v !== "string" || v.trim() !== "")) return v;
  }
  return undefined;
}

function toEntityType(v: unknown, nameHint?: string): EntityType {
  const s = String(v ?? "").toUpperCase();
  if (s === "AA" || /\bAA\b/.test(s) || (nameHint && /\bAA\b/.test(nameHint.toUpperCase()))) return "AA";
  if (s === "FIU" || /\bFIU\b/.test(s) || (nameHint && /\bFIU\b/.test(nameHint.toUpperCase()))) return "FIU";
  return "FIP"; // sensible fallback
}

/** Normalize many date inputs to IST "YYYY-MM-DD HH:mm:ss" (or null). */
function normalizeToISTLocal(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;

  // Already looks like "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(s)) {
    return s.replace("T", " ");
  }
  // Date only
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s} 00:00:00`;
  }

  // Otherwise parse (ISO / RFC 2822 / etc.), then shift to IST (+05:30)
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const msIST = d.getTime() + 330 * 60000; // +05:30
  const ist = new Date(msIST);

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = ist.getUTCFullYear();
  const MM = pad(ist.getUTCMonth() + 1);
  const dd = pad(ist.getUTCDate());
  const hh = pad(ist.getUTCHours());
  const mm = pad(ist.getUTCMinutes());
  const ss = pad(ist.getUTCSeconds());
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

/** Map a backend row to our UI shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSecretExpiryRow(row: any): SecretExpiryItem {
  const ei = row?.entityinfo ?? row;

  const name = c<string>(ei?.name, row?.entity_name, row?.entityName, row?.requester?.name) ?? "Unknown";
  const id = c<string>(ei?.id, row?.entity_id, row?.entityId, row?.requester?.id) ?? "unknown-id";
  const type = toEntityType(c(ei?.type, row?.entity_type, row?.type), name);

  // Common backend keys we’ve seen: expiry, expiryDate, expiry_date, secret_expiry, expiry_datetime, etc.
  const rawExpiry = c(
    row?.expiry,
    row?.expiryDate,
    row?.expiry_date,
    row?.expiry_datetime,
    row?.secret_expiry,
    ei?.expiry,
    ei?.expiryDate,
    ei?.secret_expiry
  );

  return {
    name,
    id,
    type,
    expiryAt: normalizeToISTLocal(rawExpiry),
  };
}

/** POST /secret/expiry/query  (legacy client: API_BASE_URL + /api/secret/expiry/query) */
export async function fetchSecretExpiry(forceRefresh = false): Promise<SecretExpiryItem[]> {
  const res = await api.post(`/secret/expiry/query`, { forceRefresh });
  const arr = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return arr.map(mapSecretExpiryRow);
}

/** ---------------- Token refresh-rate telemetry ---------------- */
export type TokenTelemetryRow = {
  /** YYYY-MM-DD (server’s day bucket) */
  date: string;
  entity_name: string;
  entity_id: string;
  tokens_issued: number;
  tokens_not_issued: number;
  /** "YYYY-MM-DD HH:mm:ss" (IST), or null if none recorded */
  last_token_time: string | null;
};

function toInt(v: unknown, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function normalizeDayString(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

/** Map backend row → TokenTelemetryRow (defensive over keys/casing). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTokenRow(row: any): TokenTelemetryRow {
  // Always coerce to YYYY-MM-DD even if server sends a full timestamp in __time
  const date = normalizeDayString(c(row.__time, row.date, row.day));
  const entity_name = c<string>(row.entity_name, row.name, row.requester?.name) ?? "Unknown";
  const entity_id = c<string>(row.entity_id, row.id, row.requester?.id) ?? "unknown-id";
  const tokens_issued = toInt(c(row.tokens_issued, row.issued, row.ok));
  const tokens_not_issued = toInt(c(row.tokens_not_issued, row.not_issued, row.failed));
  const last_token_time = normalizeToISTLocal(c(row.last_token_time, row.last_token, row.max_time));

  return {
    date,
    entity_name,
    entity_id,
    tokens_issued,
    tokens_not_issued,
    last_token_time,
  };
}

/**
 * POST /api/token/data/query
 * Returns per-day, per-entity token issuance metrics for a recent window.
 */
export async function fetchTokenData(): Promise<TokenTelemetryRow[]> {
  const res = await api.post(`/token/data/query`, {});
  const arr = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
  return arr.map(mapTokenRow);
}
