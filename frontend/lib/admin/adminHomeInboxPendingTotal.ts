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

/** 今日待办四通道合计（跳过无权限 / 拉取失败通道；失败通道不得计为 0）。 */
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
    const ch = channels[key];
    if (!ch || ch.permissionDenied) return acc;
    if (ch.errorKind != null) return acc;
    const n = counts[key];
    if (n === null) return acc;
    return acc + n;
  }, 0);

  if (loading) {
    const hasResolvedCount = ADMIN_HOME_INBOX_QUEUE_KEYS.some((key) => {
      const ch = channels[key];
      return (
        !!ch &&
        !ch.permissionDenied &&
        ch.errorKind == null &&
        canAccessAdminInboxChannel(key, hasPermission, permissionsLoaded) &&
        counts[key] !== null
      );
    });
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

/**
 * Product Baseline · Inbox Focus 默认：模块墙为辅助 → 恒默认收起。
 * `pendingTotal` 保留签名（调用方兼容）。
 */
export function adminHomeModulesFoldDefaultOpen(pendingTotal: number | null): boolean {
  void pendingTotal;
  return false;
}
