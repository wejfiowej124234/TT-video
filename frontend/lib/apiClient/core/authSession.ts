export type AuthHeaders = { "X-User-Id"?: string; Authorization?: string };

/** 与 POST /auth/login、/auth/register 返回的 `token` 一致；有 DB 时为不透明 `tts_<uuid>`（见 crates/api 鉴权）。 */
export const AUTH_SESSION_TOKEN_KEY = "traveltrust_session_token";
export const AUTH_USER_ID_KEY = "traveltrust_user_id";
/** middleware 与 Bearer 对齐：须与 `traveltrust_session_token` 同存同清，勿仅凭 `traveltrust_user_id`。 */
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

/** 开发/链下模式可从 localStorage 或 env 取；登录后优先带 Bearer（DB 模式下须带 token，勿仅 X-User-Id）。 */
export function getAuthHeaders(): AuthHeaders {
  if (typeof window !== "undefined") {
    const tok = localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim();
    if (tok) return { Authorization: `Bearer ${tok}` };
    const uid = localStorage.getItem(AUTH_USER_ID_KEY);
    if (uid) return { "X-User-Id": uid };
  }
  const dev = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEV_USER_ID;
  if (dev) return { "X-User-Id": process.env.NEXT_PUBLIC_DEV_USER_ID! };
  return {};
}
