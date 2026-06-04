/** 与 `crates/api/src/routes/admin/admin_rbac.rs` · `registry/admin-rbac-permissions.v1.yaml` 同键。 */
export const ADMIN_PERM = {
  READ: "admin.read",
  APPROVE: "admin.approve",
  ONBOARDING_READ: "admin.onboarding.read",
  ONBOARDING_WRITE: "admin.onboarding.write",
  ONBOARDING_PROVIDER_REVIEW: "admin.onboarding.provider_review",
  ONBOARDING_STEWARD_REVIEW: "admin.onboarding.steward_review",
  USERS_READ: "admin.users.read",
  USERS_WRITE: "admin.users.write",
  ORDERS_READ: "admin.orders.read",
  DISPUTES_WRITE: "admin.disputes.write",
  COMMUNITY_READ: "admin.community.read",
  COMMUNITY_MODERATE: "admin.community.moderate",
  COMMUNITY_SUPER: "admin.community.super",
  FINANCE_READ: "admin.finance.read",
  TRUST_GROWTH_WRITE: "admin.trust_growth.write",
  PLATFORM_READ: "admin.platform.read",
  PLATFORM_PUBLISH: "admin.platform.publish",
  ACQUISITION_SUSPEND: "admin.acquisition.suspend",
} as const;

export type AdminPermissionId = (typeof ADMIN_PERM)[keyof typeof ADMIN_PERM];

export const ADMIN_PERMISSION_MATRIX_ROWS: {
  id: AdminPermissionId;
  labelKey: string;
  superOnly?: boolean;
}[] = [
  { id: ADMIN_PERM.READ, labelKey: "admin_perm_read" },
  { id: ADMIN_PERM.APPROVE, labelKey: "admin_perm_approve", superOnly: true },
  { id: ADMIN_PERM.ONBOARDING_READ, labelKey: "admin_perm_onboarding_read" },
  { id: ADMIN_PERM.ONBOARDING_WRITE, labelKey: "admin_perm_onboarding_write" },
  { id: ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW, labelKey: "admin_perm_provider_review" },
  { id: ADMIN_PERM.ONBOARDING_STEWARD_REVIEW, labelKey: "admin_perm_steward_review" },
  { id: ADMIN_PERM.USERS_READ, labelKey: "admin_perm_users_read" },
  { id: ADMIN_PERM.USERS_WRITE, labelKey: "admin_perm_users_write" },
  { id: ADMIN_PERM.ORDERS_READ, labelKey: "admin_perm_orders_read" },
  { id: ADMIN_PERM.DISPUTES_WRITE, labelKey: "admin_perm_disputes_write" },
  { id: ADMIN_PERM.COMMUNITY_READ, labelKey: "admin_perm_community_read" },
  { id: ADMIN_PERM.COMMUNITY_MODERATE, labelKey: "admin_perm_community_moderate" },
  { id: ADMIN_PERM.COMMUNITY_SUPER, labelKey: "admin_perm_community_super", superOnly: true },
  { id: ADMIN_PERM.FINANCE_READ, labelKey: "admin_perm_finance_read" },
  { id: ADMIN_PERM.TRUST_GROWTH_WRITE, labelKey: "admin_perm_trust_growth_write" },
  { id: ADMIN_PERM.PLATFORM_READ, labelKey: "admin_perm_platform_read" },
  { id: ADMIN_PERM.PLATFORM_PUBLISH, labelKey: "admin_perm_platform_publish", superOnly: true },
  { id: ADMIN_PERM.ACQUISITION_SUSPEND, labelKey: "admin_perm_acquisition_suspend" },
];
