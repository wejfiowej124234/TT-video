import type { AdminHomeInboxKey } from "./adminHomeModel";
import { canAccessAdminInboxChannel } from "./adminInboxChannelPermission";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "./useAdminHomeInbox";

export const ADMIN_HOME_INBOX_QUEUE_KEYS: readonly AdminHomeInboxKey[] = [
  "provider",
  "steward",
  "approvals",
  "reports",
];

/** 今日待办四通道合计（跳过无权限通道）。 */
export function adminHomeInboxPendingTotal(
  counts: AdminHomeInboxCounts,
  channels: AdminHomeInboxChannels,
  loading: boolean,
  error: boolean,
  hasPermission: (perm: string) => boolean,
  permissionsLoaded: boolean,
): number | null {
  if (loading || error || !permissionsLoaded) return null;
  return ADMIN_HOME_INBOX_QUEUE_KEYS.reduce((sum, key) => {
    if (!canAccessAdminInboxChannel(key, hasPermission, permissionsLoaded)) return sum;
    if (channels[key].permissionDenied) return sum;
    return sum + (counts[key] ?? 0);
  }, 0);
}

/** 有待办时默认收起「全部模块」卡片墙，减轻三重导航（P3 · ①）。 */
export function adminHomeModulesFoldDefaultOpen(pendingTotal: number | null): boolean {
  return pendingTotal === null || pendingTotal === 0;
}
