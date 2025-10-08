const storage: Storage = sessionStorage;

const KEY = "ops.auth"; // { email, token }

export type AuthUser = { email: string; token: string } | null;

export function getUser(): AuthUser {
  try {
    const raw = storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setUser(u: { email: string; token: string }) {
  try {
    storage.setItem(KEY, JSON.stringify(u));
  } catch {
    return null;
  }
}

export function clearUser() {
  try {
    storage.removeItem(KEY);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return getUser()?.token ?? null;
}
