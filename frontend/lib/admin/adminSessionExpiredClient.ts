import {
  clearAuthSessionCookies,
  clearClientAuthStorage,
} from "@/lib/apiClient/core/authSession";
import { clearGetMeCache } from "@/lib/apiClient/me";
import { resetAdminAuthSessionState } from "@/lib/admin/adminAuthSessionReset";

let adminSessionExpiredResetStarted = false;

export function adminApiEnvelopeCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const row = body as { code?: unknown; error?: unknown; message?: unknown };
  if (typeof row.code === "string" && row.code.trim()) return row.code.trim();
  if (typeof row.error === "string" && row.error.trim()) return row.error.trim();
  if (typeof row.message === "string" && row.message.trim()) return row.message.trim();
  return null;
}

export function isAdminCapabilitiesSessionExpired(
  httpStatus: number,
  code: string | null | undefined,
): boolean {
  return (
    httpStatus === 401 ||
    code === "login_required" ||
    code === "http_401" ||
    code === "unauthorized"
  );
}

/** 任一 admin JSON fetch 401 / 无效 Bearer：清会话并跳转登录（幂等）。 */
export function maybeApplyAdminSessionExpiredFromAdminFetch(
  res: Response,
  body: unknown,
): boolean {
  const code = adminApiEnvelopeCode(body);
  if (!isAdminCapabilitiesSessionExpired(res.status, code)) return false;
  applyAdminSessionExpiredClientReset();
  return true;
}

/** capabilities 401 / 无效 Bearer：清 localStorage、middleware cookie、admin cookie，并跳转登录。 */
export function applyAdminSessionExpiredClientReset(options?: { redirect?: boolean }): void {
  if (typeof window !== "undefined" && adminSessionExpiredResetStarted) return;
  adminSessionExpiredResetStarted = true;
  clearGetMeCache();
  clearClientAuthStorage();
  clearAuthSessionCookies();
  resetAdminAuthSessionState();
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  if (options?.redirect === false) return;
  const returnUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.assign(`/auth/login?returnUrl=${returnUrl}`);
}

/** @internal vitest */
export function resetAdminSessionExpiredClientForTests(): void {
  adminSessionExpiredResetStarted = false;
}
