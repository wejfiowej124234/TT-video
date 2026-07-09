import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";

const STORAGE_KEY = "tt_admin_recent_visits_v1";
const MAX = 8;

export type AdminRecentVisit = {
  path: string;
  at: number;
};

function readRaw(): AdminRecentVisit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is AdminRecentVisit =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as AdminRecentVisit).path === "string" &&
        typeof (v as AdminRecentVisit).at === "number",
    );
  } catch {
    return [];
  }
}

function writeRaw(list: AdminRecentVisit[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

/** ① 记录 Admin 子路由访问（localStorage · 非跨设备）。 */
export function recordAdminRecentVisit(pathname: string) {
  if (!pathname.startsWith("/admin") || pathname === "/admin") return;
  const path = pathname.split("?")[0] ?? pathname;
  const list = readRaw().filter((v) => v.path !== path);
  list.unshift({ path, at: Date.now() });
  writeRaw(list);
}

export function getAdminRecentVisits(limit = 6): AdminRecentVisit[] {
  return readRaw().slice(0, limit);
}

/** 最近访问存 pathname；展示链回收件箱默认筛选（与 `ADMIN_INBOX_QUEUE_HREFS` 对拍）。 */
const ADMIN_RECENT_PATH_TO_INBOX_HREF: Record<string, string> = {
  "/admin/provider-applications": ADMIN_INBOX_QUEUE_HREFS.provider,
  "/admin/steward-applications": ADMIN_INBOX_QUEUE_HREFS.steward,
  "/admin/approvals": ADMIN_INBOX_QUEUE_HREFS.approvals,
  "/admin/community/reports": ADMIN_INBOX_QUEUE_HREFS.reports,
};

export function adminRecentVisitHref(storedPath: string): string {
  return ADMIN_RECENT_PATH_TO_INBOX_HREF[storedPath] ?? storedPath;
}

/** pathname → i18n titleKey（与 Shell / 首页卡片同源）。 */
export const ADMIN_RECENT_PATH_TITLE_KEYS: Record<string, string> = {
  "/admin/provider-applications": "admin_provider_list_title",
  "/admin/steward-applications": "admin_steward_list_title",
  "/admin/approvals": "admin_approvals_title",
  "/admin/community/reports": "admin_community_reports_title",
  "/admin/orders": "admin_orders_title",
  "/admin/disputes": "admin_disputes_title",
  "/admin/users": "admin_users_title",
  "/admin/finance-suite": "admin_shell_nav_finance_suite",
  "/admin/vacancy-ledger": "admin_shell_nav_vacancy_ledger_ops",
  "/admin/onboarding": "admin_onboarding_hub_title",
  "/admin/permissions": "admin_permissions_title",
  "/admin/inbox": "admin_unified_inbox_title",
};
