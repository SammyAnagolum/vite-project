// src/lib/http.ts
import axios from "axios";

const ENV_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
const DEFAULT_BASE = ENV_BASE || "/api"; // dev default goes through Vite proxy

export const api = axios.create({
  baseURL: DEFAULT_BASE,
});

export function setApiBase(url?: string) {
  const clean = typeof url === "string" && url.trim() ? url : DEFAULT_BASE;
  clean.replace(/\/+$/, ""); // strip trailing slashes
  api.defaults.baseURL = clean.endsWith("/api") ? clean : `${clean}/api`; // Make sure we hit /api
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as any)?.message || err.message || "Request failed"; // eslint-disable-line
  }
  return "Request failed";
}
