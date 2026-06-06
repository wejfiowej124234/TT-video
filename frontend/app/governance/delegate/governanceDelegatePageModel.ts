import { AUTH_SESSION_TOKEN_KEY, AUTH_USER_ID_KEY } from "@/lib/apiClient";

export function hasClientSession(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim() ||
    localStorage.getItem(AUTH_USER_ID_KEY)?.trim()
  );
}
