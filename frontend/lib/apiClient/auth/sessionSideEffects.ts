import {
  AUTH_SESSION_TOKEN_KEY,
  AUTH_USER_ID_KEY,
  clearAuthSessionCookies,
  clearAuthSessionOkCookie,
  clearClientAuthStorage,
  writeAuthSessionOkCookie,
} from "../core/authSession";
import { clearGetMeCache } from "../me";
import { clearDevApiOfflineMeFetchBlocked } from "../me/meFetchDevOffline";

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

/**
 * 登录/注册成功后写入浏览器会话并通知全站（07 Phase 4、53-S23：顶栏/getMe 与社区同源）。
 * @returns 已写入的 user_id，失败时 undefined
 */
/** 将 localStorage 用户 id 同步到 middleware 可读 cookie（硬刷新 Admin 时避免误跳登录）。 */
export function syncClientSessionUserIdCookieFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const userId = localStorage.getItem(AUTH_USER_ID_KEY)?.trim();
    const token = localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim();
    if (!userId || !token) return false;
    const encoded = `${AUTH_USER_ID_KEY}=`;
    const okPrefix = "traveltrust_session_ok=";
    const hasUid = document.cookie.split(";").some((part) => part.trim().startsWith(encoded));
    const hasOk = document.cookie.split(";").some((part) => part.trim().startsWith(okPrefix));
    if (hasUid && hasOk) return true;
    document.cookie = `${AUTH_USER_ID_KEY}=${encodeURIComponent(userId)}; Path=/; SameSite=Lax`;
    writeAuthSessionOkCookie();
    return true;
  } catch {
    return false;
  }
}

export function applyClientSessionAfterAuth(res: unknown): string | undefined {
  const userId = (res as { user_id?: string })?.user_id?.trim();
  const token = (res as { token?: string })?.token?.trim();
  if (!userId || typeof window === "undefined") return undefined;
  localStorage.setItem(AUTH_USER_ID_KEY, userId);
  if (token) {
    localStorage.setItem(AUTH_SESSION_TOKEN_KEY, token);
    writeAuthSessionOkCookie();
  } else {
    clearAuthSessionOkCookie();
  }
  document.cookie = `${AUTH_USER_ID_KEY}=${encodeURIComponent(userId)}; Path=/; SameSite=Lax`;
  clearGetMeCache();
  clearDevApiOfflineMeFetchBlocked();
  window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  return userId;
}
