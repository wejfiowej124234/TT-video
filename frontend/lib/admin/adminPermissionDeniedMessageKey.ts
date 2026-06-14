import { ADMIN_PERM, type AdminPermissionId } from "@/lib/admin/adminPermissionIds";

/** ①：按权限 id 解析无权限横幅文案 key（page.tsx 薄壳可省略 messageKey）。 */
const ADMIN_PERM_DENIED_MESSAGE_KEY: Partial<Record<AdminPermissionId, string>> = {
  [ADMIN_PERM.USERS_READ]: "admin_perm_denied_users_read",
  [ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW]: "admin_perm_denied_provider_review",
  [ADMIN_PERM.ONBOARDING_STEWARD_REVIEW]: "admin_perm_denied_steward_review",
  [ADMIN_PERM.ONBOARDING_READ]: "admin_perm_denied_onboarding_read",
  [ADMIN_PERM.ONBOARDING_WRITE]: "admin_perm_denied_onboarding_write",
  [ADMIN_PERM.ORDERS_READ]: "admin_perm_denied_orders_read",
  [ADMIN_PERM.FINANCE_READ]: "admin_perm_denied_finance_read",
  [ADMIN_PERM.COMMUNITY_READ]: "admin_perm_denied_community_read",
  [ADMIN_PERM.COMMUNITY_MODERATE]: "admin_perm_denied_community_moderate",
  [ADMIN_PERM.COMMUNITY_SUPER]: "admin_perm_denied_community_super",
  [ADMIN_PERM.PLATFORM_PUBLISH]: "admin_perm_denied_platform_publish",
  [ADMIN_PERM.APPROVE]: "admin_perm_denied_approve",
  [ADMIN_PERM.TRUST_GROWTH_WRITE]: "admin_perm_denied_trust_growth_write",
  [ADMIN_PERM.READ]: "admin_perm_denied_read",
  [ADMIN_PERM.CONTENT_READ]: "admin_perm_denied_content_read",
  [ADMIN_PERM.CONTENT_WRITE]: "admin_perm_denied_content_write",
  [ADMIN_PERM.CONTENT_PUBLISH]: "admin_perm_denied_content_publish",
  [ADMIN_PERM.OFFICIAL_READ]: "admin_perm_denied_official_read",
  [ADMIN_PERM.OFFICIAL_WRITE]: "admin_perm_denied_official_write",
  [ADMIN_PERM.OFFICIAL_PUBLISH]: "admin_perm_denied_official_publish",
  [ADMIN_PERM.GROWTH_READ]: "admin_perm_denied_growth_read",
  [ADMIN_PERM.GROWTH_WRITE]: "admin_perm_denied_growth_write",
  [ADMIN_PERM.GROWTH_PUBLISH]: "admin_perm_denied_growth_publish",
  [ADMIN_PERM.GROWTH_FRAUD]: "admin_perm_denied_growth_fraud",
  [ADMIN_PERM.DISPUTES_WRITE]: "admin_perm_denied_disputes_write",
};

export function adminPermissionDeniedMessageKey(permission: AdminPermissionId): string {
  return ADMIN_PERM_DENIED_MESSAGE_KEY[permission] ?? "admin_perm_denied_read";
}
