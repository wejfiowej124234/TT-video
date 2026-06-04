/** Admin 2FA 会话（`POST …/security/totp/verify` 返回；`x-traveltrust-admin-2fa-session`）。 */

export const ADMIN_2FA_SESSION_STORAGE_KEY = "traveltrust_admin_2fa_session";
export const ADMIN_2FA_SESSION_HEADER = "x-traveltrust-admin-2fa-session";

export function getAdmin2faSessionHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const tok = localStorage.getItem(ADMIN_2FA_SESSION_STORAGE_KEY)?.trim();
  if (!tok) return {};
  return { [ADMIN_2FA_SESSION_HEADER]: tok };
}

export function setAdmin2faSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  const t = token.trim();
  if (!t) return;
  localStorage.setItem(ADMIN_2FA_SESSION_STORAGE_KEY, t);
  window.dispatchEvent(new Event("traveltrust:admin-2fa-change"));
}

export function clearAdmin2faSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_2FA_SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event("traveltrust:admin-2fa-change"));
}
