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
  "/admin/finance": "admin_finance_title",
  "/admin/vacancy-ledger": "admin_shell_nav_vacancy_ledger_ops",
  "/admin/onboarding": "admin_onboarding_hub_title",
  "/admin/permissions": "admin_permissions_title",
  "/admin/config": "admin_config_hub_title",
  "/admin/flags": "admin_flags_title",
  "/admin/inbox": "admin_unified_inbox_title",
  "/admin/content": "admin_shell_nav_content_hub",
  "/admin/content/countries": "admin_content_countries_title",
  "/admin/content/announcements": "admin_content_announcements_title",
  "/admin/content/publish-queue": "admin_shell_nav_content_publish_queue",
  "/admin/content/cities": "admin_shell_nav_content_cities",
  "/admin/content/pois": "admin_shell_nav_content_pois",
  "/admin/content/landing-ambient": "admin_content_landing_ambient_title",
  "/admin/guides": "admin_shell_nav_guides_short",
  "/admin/guide-applications": "admin_guide_list_title",
  "/admin/growth": "admin_growth_hub_title",
  "/admin/official": "admin_shell_nav_official_hub",
  "/admin/community": "admin_shell_nav_community_hub",
  "/admin/operator-guide": "admin_operator_guide_title",
};

/** HU-434 · 未知路径统一「未命名页」，禁 eng slug 直出。 */
export const ADMIN_RECENT_UNNAMED_TITLE_KEY = "admin_home_recent_unnamed";

export function adminRecentVisitTitleKey(pathname: string): string {
  const path = (pathname.split("?")[0] ?? pathname).replace(/\/$/, "") || pathname;
  return ADMIN_RECENT_PATH_TITLE_KEYS[path] ?? ADMIN_RECENT_UNNAMED_TITLE_KEY;
}
