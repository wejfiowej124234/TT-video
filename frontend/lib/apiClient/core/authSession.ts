export type AuthHeaders = { "X-User-Id"?: string; Authorization?: string };

/** Legacy key. BATCH-A: opaque token lives in HttpOnly `traveltrust_session`; JS must not persist this. */
export const AUTH_SESSION_TOKEN_KEY = "traveltrust_session_token";
export const AUTH_USER_ID_KEY = "traveltrust_user_id";
/** Non-HttpOnly UX hint. Admin gate uses HttpOnly `traveltrust_session`, not this cookie alone. */
export const AUTH_SESSION_OK_COOKIE = "traveltrust_session_ok";

const AUTH_SESSION_OK_MAX_AGE_SEC = 60 * 60 * 8;

export function writeAuthSessionOkCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_OK_COOKIE}=1; Path=/; Max-Age=${AUTH_SESSION_OK_MAX_AGE_SEC}; SameSite=Lax`;
}

export function clearAuthSessionOkCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_OK_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function clearAuthSessionCookies(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_USER_ID_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  clearAuthSessionOkCookie();
}

export function clearClientAuthStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_USER_ID_KEY);
  localStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
}

/** JS-visible session hint. Secret is HttpOnly; this does not authenticate by itself. */
export function hasWwwSessionHint(): boolean {
  if (typeof document !== "undefined") {
    const ok = document.cookie.split(";").some((part) => part.trim().startsWith(`${AUTH_SESSION_OK_COOKIE}=`));
    if (ok) return true;
  }
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(AUTH_USER_ID_KEY)?.trim());
  } catch {
    return false;
  }
}

export function canProbeAccountSession(headers?: AuthHeaders): boolean {
  if (hasWwwSessionHint()) return true;
  const h = headers ?? getAuthHeaders();
  return !!(h.Authorization || h["X-User-Id"]);
}

/** Never read leftover LS token. Local-dev only: NEXT_PUBLIC_DEV_USER_ID. Cookie Bearer is injected at www middleware. */
export function getAuthHeaders(): AuthHeaders {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }
  const dev = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEV_USER_ID;
  if (dev) return { "X-User-Id": process.env.NEXT_PUBLIC_DEV_USER_ID! };
  return {};
}
