/** ① · middleware / 会话 hint：capabilities 成功后可读；403 写 denied；登出清除。 */

export const ADMIN_CONSOLE_ACCESS_COOKIE = "traveltrust_admin_console";

export type AdminConsoleAccessCookieValue = "granted" | "denied";

export function writeAdminConsoleAccessCookie(value: AdminConsoleAccessCookieValue): void {
  if (typeof document === "undefined") return;
  const maxAge = value === "granted" ? 60 * 60 * 8 : 60 * 5;
  document.cookie = `${ADMIN_CONSOLE_ACCESS_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearAdminConsoleAccessCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ADMIN_CONSOLE_ACCESS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function isAdminConsoleAccessDeniedErrorCode(code: string | null): boolean {
  return code === "admin_required" || code === "forbidden" || code === "super_admin_required";
}
