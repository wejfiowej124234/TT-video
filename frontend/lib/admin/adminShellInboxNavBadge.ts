import { adminHomeInboxPendingTotal } from "@/lib/admin/adminHomeInboxPendingTotal";
import {
  adminShellSidebarInboxKeyForHref,
  type AdminShellSidebarInboxKey,
} from "@/lib/admin/adminShellSidebarPending";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";

export const ADMIN_SHELL_INBOX_HUB_HREF = "/admin/inbox";

export type AdminShellNavPendingResult = {
  count: number | null;
  inboxKey: AdminShellSidebarInboxKey | "hub" | null;
};

/** 顶栏/侧栏待办徽标：队列 href 用单通道计数；`/admin/inbox` 用四通道合计。 */
export function adminShellNavPendingCount(
  href: string,
  counts: AdminHomeInboxCounts,
  channels: AdminHomeInboxChannels,
  loading: boolean,
  error: boolean,
  hasPermission: (perm: string) => boolean,
  permissionsLoaded: boolean,
): AdminShellNavPendingResult {
  const base = href.split("?")[0] ?? href;
  if (base === ADMIN_SHELL_INBOX_HUB_HREF) {
    return {
      count: adminHomeInboxPendingTotal(
        counts,
        channels,
        loading,
        error,
        hasPermission,
        permissionsLoaded,
      ),
      inboxKey: "hub",
    };
  }
  const key = adminShellSidebarInboxKeyForHref(href);
  if (!key) return { count: null, inboxKey: null };
  if (loading) return { count: null, inboxKey: key };
  const n = counts[key];
  return { count: n === null ? null : n, inboxKey: key };
}
