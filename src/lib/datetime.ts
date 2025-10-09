// src/lib/datetime.ts

/** Date → "YYYY-MM-DD" (IST) */
export function ymd(d = new Date()): string {
  const ist = toIST(d);
  return `${ist.getFullYear()}-${pad2(ist.getMonth() + 1)}-${pad2(ist.getDate())}`;
}

/** Date → "YYYY-MM-DD HH:mm:ss" (IST) */
export function fmtIST(d: Date = new Date()): string {
  const ist = toIST(d);
  return `${ist.getFullYear()}-${pad2(ist.getMonth() + 1)}-${pad2(ist.getDate())} ${pad2(ist.getHours())}:${pad2(
    ist.getMinutes()
  )}:${pad2(ist.getSeconds())}`;
}

/** Parse "YYYY-MM-DD HH:mm:ss" as IST, or return null */
export function parseIstString(s?: string | null): Date | null {
  if (!s) return null;
  const t = Date.parse(`${s.replace(" ", "T")}+05:30`);
  return Number.isFinite(t) ? new Date(t) : null;
}

/** Start/end of day in IST for a given "YYYY-MM-DD" */
export const istStartOfDay = (ymdStr: string) => new Date(`${ymdStr}T00:00:00.000+05:30`);
export const istEndOfDay = (ymdStr: string) => new Date(`${ymdStr}T23:59:59.999+05:30`);

/** Ensure "YYYY-MM-DD" from loose inputs (e.g., "__time" or ISO) */
export function ensureYmd(v: unknown): string {
  const s = String(v ?? "");
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

/** Normalize anything parseable → IST "YYYY-MM-DD HH:mm:ss" (or null) */
export function toIstString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(s)) return s.replace("T", " ");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : fmtIST(d);
}

/** Latest (max) of two IST strings like "YYYY-MM-DD HH:mm:ss"; returns "-" if neither */
export function latestIst(a?: string | null, b?: string | null): string | "-" {
  const da = parseIstString(a);
  const db = parseIstString(b);
  if (da && db) return da > db ? (a as string) : (b as string);
  if (da) return a as string;
  if (db) return b as string;
  return "-";
}

/** Days until IST midnight boundary for an IST timestamp string */
export function daysUntilIst(istYmdHms: string): number {
  const target = parseIstString(istYmdHms);
  if (!target) return Number.NaN;
  const today = istStartOfDay(ymd()); // today 00:00 IST
  const tgt = istStartOfDay(ymd(target)); // target 00:00 IST
  return Math.ceil((tgt.getTime() - today.getTime()) / 86400000);
}

/** Filename stamp "YYYY-MM-DD_HH-mm-ss" (IST) */
export function filenameStampIST(d = new Date()): string {
  const ist = toIST(d);
  return `${ist.getFullYear()}-${pad2(ist.getMonth() + 1)}-${pad2(ist.getDate())}_${pad2(ist.getHours())}-${pad2(
    ist.getMinutes()
  )}-${pad2(ist.getSeconds())}`;
}

/** Special-case: Reports API needs UTC "YYYY-MM-DD HH:mm:ss.000000" */
export function isoToUtcMicrosecondStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(
    d.getUTCMinutes()
  )}:${pad2(d.getUTCSeconds())}.000000`;
}

/** Exported-at string (IST, en-GB) for Excel preamble */
export function exportedAtIST(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" }).format(
    new Date()
  );
}

/* internals */
function toIST(d: Date): Date {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 330 * 60000); // +05:30
}
const pad2 = (n: number) => String(n).padStart(2, "0");
