import { ADMIN_PERM, type AdminPermissionId } from "./adminPermissionIds";

/** ①：权限 id → 拒绝横幅 i18n 键（与页内 AdminPermissionDeniedBanner 同源）。 */
export const ADMIN_PERM_DENIED_MESSAGE_KEY: Record<AdminPermissionId, string> = {
  [ADMIN_PERM.READ]: "admin_perm_denied_read",
  [ADMIN_PERM.APPROVE]: "admin_perm_denied_approve",
  [ADMIN_PERM.ONBOARDING_READ]: "admin_perm_denied_onboarding_read",
  [ADMIN_PERM.ONBOARDING_WRITE]: "admin_perm_denied_onboarding_write",
  [ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW]: "admin_perm_denied_provider_review",
  [ADMIN_PERM.ONBOARDING_STEWARD_REVIEW]: "admin_perm_denied_steward_review",
  [ADMIN_PERM.USERS_READ]: "admin_perm_denied_users_read",
  [ADMIN_PERM.USERS_WRITE]: "admin_perm_denied_users_write",
  [ADMIN_PERM.ORDERS_READ]: "admin_perm_denied_orders_read",
  [ADMIN_PERM.DISPUTES_WRITE]: "admin_perm_denied_orders_read",
  [ADMIN_PERM.COMMUNITY_READ]: "admin_perm_denied_community_read",
  [ADMIN_PERM.COMMUNITY_MODERATE]: "admin_perm_denied_community_moderate",
  [ADMIN_PERM.COMMUNITY_SUPER]: "admin_perm_denied_community_super",
  [ADMIN_PERM.FINANCE_READ]: "admin_perm_denied_finance_read",
  [ADMIN_PERM.TRUST_GROWTH_WRITE]: "admin_perm_denied_trust_growth_write",
  [ADMIN_PERM.PLATFORM_READ]: "admin_perm_denied_read",
  [ADMIN_PERM.PLATFORM_PUBLISH]: "admin_perm_denied_platform_publish",
  [ADMIN_PERM.ACQUISITION_SUSPEND]: "admin_perm_denied_users_write",
};

export function adminPermDeniedMessageKey(permission: AdminPermissionId): string {
  return ADMIN_PERM_DENIED_MESSAGE_KEY[permission] ?? "admin_perm_denied_read";
}
