// POST /api/login  → returns { accessToken: string, ... }
import { api } from "@/lib/http";

export function userTokenGenerate(payload: { username: string; password: string }) {
  return api.post("/login", payload);
}
