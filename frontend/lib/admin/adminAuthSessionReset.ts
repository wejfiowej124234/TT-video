import { resetAdminCapabilitiesBootState } from "@/lib/admin/adminCapabilitiesBootState";
import { invalidateAdminCapabilitiesFetchCache } from "@/lib/admin/adminCapabilitiesFetchCache";
import { clearAdminConsoleAccessCookie } from "@/lib/admin/adminConsoleAccessCookie";
import { invalidateAdminHomeOverviewCache } from "@/lib/admin/adminHomeOverviewFetchCache";
import { invalidateAdminListFetchCache } from "@/lib/admin/adminListFetchCache";
import { resetAdminRoutePrefetchSession } from "@/lib/admin/adminRoutePrefetchSession";

/** 登出 / 切账号 · 全链路 reset（boot latch · prefetch · SWR · 首页队列）。 */
export const ADMIN_AUTH_SESSION_RESET_EVENT = "traveltrust:admin-auth-session-reset";

export function resetAdminAuthSessionState(): void {
  resetAdminCapabilitiesBootState();
  resetAdminRoutePrefetchSession();
  invalidateAdminListFetchCache();
  invalidateAdminHomeOverviewCache();
  invalidateAdminCapabilitiesFetchCache();
  clearAdminConsoleAccessCookie();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_AUTH_SESSION_RESET_EVENT));
  }
}
