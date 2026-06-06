import type { AdminHomeInboxKey } from "./adminHomeModel";
import { canAccessAdminInboxChannel } from "./adminInboxChannelPermission";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "./useAdminHomeInbox";
import { readAdminHomeInboxPendingTotalCache } from "./adminHomeInboxPendingTotalCache";

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
  if (error || !permissionsLoaded) return null;

  const sum = ADMIN_HOME_INBOX_QUEUE_KEYS.reduce((acc, key) => {
    if (!canAccessAdminInboxChannel(key, hasPermission, permissionsLoaded)) return acc;
    if (channels[key].permissionDenied) return acc;
    return acc + (counts[key] ?? 0);
  }, 0);

  if (loading) {
    const hasResolvedCount = ADMIN_HOME_INBOX_QUEUE_KEYS.some(
      (key) =>
        !channels[key].permissionDenied &&
        canAccessAdminInboxChannel(key, hasPermission, permissionsLoaded) &&
        counts[key] !== null,
    );
    return hasResolvedCount ? sum : null;
  }

  return sum;
}

/**
 * 加载中且 API 合计尚未就绪时，用 session 缓存避免首页布局闪回四卡网格。
 */
export function resolveAdminHomeInboxPendingTotal(
  pendingTotal: number | null,
  inboxLoading: boolean,
  permissionsLoaded: boolean,
  inboxError: boolean,
): number | null {
  if (pendingTotal !== null) return pendingTotal;
  if (!permissionsLoaded || inboxError || !inboxLoading) return null;
  return readAdminHomeInboxPendingTotalCache();
}

/** 有待办时默认收起「全部模块」卡片墙，减轻三重导航（P3 · ①）。 */
export function adminHomeModulesFoldDefaultOpen(pendingTotal: number | null): boolean {
  return pendingTotal === null || pendingTotal === 0;
}
