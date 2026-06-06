import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";

/** ① 四队列叶节点路径（不含 query）— 面包屑/回链 SSOT。 */
export function adminInboxQueuePathname(pathname: string): string | null {
  const base = pathname.split("?")[0] ?? pathname;
  if (base === "/admin/provider-applications") return ADMIN_INBOX_QUEUE_HREFS.provider;
  if (base === "/admin/steward-applications") return ADMIN_INBOX_QUEUE_HREFS.steward;
  if (base === "/admin/approvals" || base.startsWith("/admin/approvals/")) {
    return ADMIN_INBOX_QUEUE_HREFS.approvals;
  }
  if (base === "/admin/community/reports" || base.startsWith("/admin/community/reports/")) {
    return ADMIN_INBOX_QUEUE_HREFS.reports;
  }
  return null;
}

export function adminPathShowsInboxBreadcrumb(pathname: string): boolean {
  return adminInboxQueuePathname(pathname) !== null;
}
