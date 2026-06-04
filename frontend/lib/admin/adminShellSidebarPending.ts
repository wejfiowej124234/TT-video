import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import type { AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";

export type AdminShellSidebarInboxKey = keyof AdminHomeInboxCounts;

/** 侧栏链 href → 待办计数键（与收件箱 SSOT 同源）。 */
export const ADMIN_SHELL_SIDEBAR_INBOX_BY_HREF: Record<string, AdminShellSidebarInboxKey> = {
  [ADMIN_INBOX_QUEUE_HREFS.provider]: "provider",
  [ADMIN_INBOX_QUEUE_HREFS.steward]: "steward",
  [ADMIN_INBOX_QUEUE_HREFS.approvals]: "approvals",
  [ADMIN_INBOX_QUEUE_HREFS.reports]: "reports",
};

export function adminShellSidebarInboxKeyForHref(href: string): AdminShellSidebarInboxKey | null {
  const exact = ADMIN_SHELL_SIDEBAR_INBOX_BY_HREF[href];
  if (exact) return exact;
  const base = href.split("?")[0] ?? href;
  for (const [key, val] of Object.entries(ADMIN_SHELL_SIDEBAR_INBOX_BY_HREF)) {
    if ((key.split("?")[0] ?? key) === base) return val;
  }
  return null;
}

export function adminShellSidebarPendingCount(
  href: string,
  counts: AdminHomeInboxCounts,
  loading: boolean,
): number | null {
  const key = adminShellSidebarInboxKeyForHref(href);
  if (!key) return null;
  if (loading) return null;
  const n = counts[key];
  return n === null ? null : n;
}
