// src/lib/http.ts
import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const api = axios.create({
  baseURL: API_BASE, // dev: /api  → proxied to /portal/api
});

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as any)?.message || err.message || "Request failed"; // eslint-disable-line
  }
  return "Request failed";
}
