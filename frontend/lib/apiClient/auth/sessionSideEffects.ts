import {
  AUTH_SESSION_TOKEN_KEY,
  AUTH_USER_ID_KEY,
  clearAuthSessionCookies,
  clearClientAuthStorage,
  writeAuthSessionOkCookie,
} from "../core/authSession";
import { clearGetMeCache } from "../me";
import { clearDevApiOfflineMeFetchBlocked } from "../me/meFetchDevOffline";
import { extractUserIdFromAuthJson } from "@/lib/auth/wwwSessionCookie";

/**
 * 在 **`POST /auth/logout` 已成功**（HTTP 2xx 且 envelope `status:ok`）后调用：清 getMe 缓存、localStorage 凭证、cookie，并广播 `traveltrust:auth-change`（B-065）。
 * 禁止在服务端确认前调用，以免假登出。
 */
export function applyLocalLogoutAfterServerOk(): void {
  clearGetMeCache();
  clearClientAuthStorage();
  clearAuthSessionCookies();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  }
}

/** Sync user_id cookie from localStorage. HttpOnly session cookie is set by www BFF, not JS. */
export function syncClientSessionUserIdCookieFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const userId = localStorage.getItem(AUTH_USER_ID_KEY)?.trim();
    if (!userId) return false;
    const encoded = `${AUTH_USER_ID_KEY}=`;
    const hasUid = document.cookie.split(";").some((part) => part.trim().startsWith(encoded));
    if (hasUid) return true;
    document.cookie = `${AUTH_USER_ID_KEY}=${encodeURIComponent(userId)}; Path=/; SameSite=Lax`;
    return true;
  } catch {
    return false;
  }
}

export function applyClientSessionAfterAuth(res: unknown): string | undefined {
  const userId = extractUserIdFromAuthJson(res);
  if (!userId || typeof window === "undefined") return undefined;
  try {
    localStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  localStorage.setItem(AUTH_USER_ID_KEY, userId);
  document.cookie = `${AUTH_USER_ID_KEY}=${encodeURIComponent(userId)}; Path=/; SameSite=Lax`;
  writeAuthSessionOkCookie();
  clearGetMeCache();
  clearDevApiOfflineMeFetchBlocked();
  window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  return userId;
}
