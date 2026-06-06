import { AUTH_SESSION_TOKEN_KEY, AUTH_USER_ID_KEY } from "@/lib/apiClient";

export function voteCountFromApi(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function hasClientSession(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim() ||
    localStorage.getItem(AUTH_USER_ID_KEY)?.trim()
  );
}
