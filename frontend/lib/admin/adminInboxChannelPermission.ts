import type { AdminHomeInboxKey } from "./adminHomeModel";
import { ADMIN_PERM, type AdminPermissionId } from "./adminPermissionIds";

/** 今日待办三通道 ↔ capabilities（与首页卡片 / Shell 同源）。 */
export const ADMIN_INBOX_CHANNEL_PERMISSION: Record<AdminHomeInboxKey, AdminPermissionId> = {
  provider: ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW,
  guide: ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW,
  steward: ADMIN_PERM.ONBOARDING_STEWARD_REVIEW,
  approvals: ADMIN_PERM.APPROVE,
  disputes: ADMIN_PERM.ORDERS_READ,
  reports: ADMIN_PERM.COMMUNITY_READ,
};

export function adminInboxChannelPermission(key: AdminHomeInboxKey): AdminPermissionId {
  return ADMIN_INBOX_CHANNEL_PERMISSION[key];
}

export function canAccessAdminInboxChannel(
  key: AdminHomeInboxKey,
  hasPermission: (perm: string) => boolean,
  permissionsLoaded: boolean,
): boolean {
  if (!permissionsLoaded) return false;
  return hasPermission(adminInboxChannelPermission(key));
}
