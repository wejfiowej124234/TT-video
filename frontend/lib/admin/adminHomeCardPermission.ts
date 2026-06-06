import type { AdminHomeCard } from "./adminHomeModel";
import { adminHomeCardLookupPath } from "./adminHomeCardCapability";
import { ADMIN_PERM, type AdminPermissionId } from "./adminPermissionIds";

/** ①：首页卡片所需权限（② 权限中心落库后同源）。 */
export const ADMIN_HOME_CARD_REQUIRED_PERM: Record<string, AdminPermissionId> = {
  "/admin/provider-applications": ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW,
  "/admin/steward-applications": ADMIN_PERM.ONBOARDING_STEWARD_REVIEW,
  "/admin/approvals": ADMIN_PERM.APPROVE,
  "/admin/onboarding": ADMIN_PERM.ONBOARDING_READ,
  "/admin/onboarding/entitlements": ADMIN_PERM.ONBOARDING_READ,
  "/admin/onboarding/webhook-jobs": ADMIN_PERM.ONBOARDING_READ,
  "/admin/onboarding/payment-events": ADMIN_PERM.ONBOARDING_READ,
  "/admin/onboarding/compliance-audit": ADMIN_PERM.ONBOARDING_READ,
  "/admin/permissions": ADMIN_PERM.READ,
  "/admin/users#admin-acquisition-suspend": ADMIN_PERM.ACQUISITION_SUSPEND,
  "/admin/users": ADMIN_PERM.USERS_READ,
  "/admin/guides": ADMIN_PERM.USERS_READ,
  "/admin/orders": ADMIN_PERM.ORDERS_READ,
  "/admin/disputes": ADMIN_PERM.ORDERS_READ,
  "/admin/reviews": ADMIN_PERM.READ,
  "/admin/audit": ADMIN_PERM.READ,
  "/admin/auth-audit-events": ADMIN_PERM.READ,
  "/admin/finance-reconciliation": ADMIN_PERM.FINANCE_READ,
  "/admin/finance": ADMIN_PERM.FINANCE_READ,
  "/admin/fee-router": ADMIN_PERM.FINANCE_READ,
  "/admin/region-vault": ADMIN_PERM.FINANCE_READ,
  "/admin/observability": ADMIN_PERM.READ,
  "/admin/trust-growth": ADMIN_PERM.TRUST_GROWTH_WRITE,
  "/admin/cross-check": ADMIN_PERM.READ,
  "/admin/drift-summary": ADMIN_PERM.READ,
  "/admin/audit/operations": ADMIN_PERM.READ,
  "/admin/alerts/incidents": ADMIN_PERM.READ,
  "/admin/indexer": ADMIN_PERM.READ,
  "/admin/indexer/reconcile-reports": ADMIN_PERM.READ,
  "/admin/schema": ADMIN_PERM.READ,
  "/admin/community/reports": ADMIN_PERM.COMMUNITY_READ,
  "/admin/community/appeals": ADMIN_PERM.COMMUNITY_READ,
  "/admin/community/moderation/cases": ADMIN_PERM.COMMUNITY_READ,
  "/admin/community/risk-signals": ADMIN_PERM.COMMUNITY_READ,
  "/admin/community/policy-change-logs": ADMIN_PERM.COMMUNITY_READ,
  "/admin/community/ranking/snapshots": ADMIN_PERM.COMMUNITY_READ,
  "/admin/community/penalties": ADMIN_PERM.COMMUNITY_MODERATE,
  "/admin/api-versions": ADMIN_PERM.PLATFORM_READ,
  "/admin/lifecycle": ADMIN_PERM.PLATFORM_READ,
  "/admin/policies": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/internal-tools/audits": ADMIN_PERM.READ,
  "/admin/media/access-logs": ADMIN_PERM.READ,
  "/admin/media/signed-url-tokens": ADMIN_PERM.READ,
  "/admin/config": ADMIN_PERM.PLATFORM_READ,
  "/admin/flags": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/jobs": ADMIN_PERM.PLATFORM_READ,
  "/admin/config/releases": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/secrets/metadata": ADMIN_PERM.PLATFORM_READ,
  "/admin/scheduler/jobs": ADMIN_PERM.APPROVE,
  "/admin/tenants/scopes": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/compliance": ADMIN_PERM.READ,
  "/admin/finance-suite": ADMIN_PERM.FINANCE_READ,
  "/admin/compliance/requests": ADMIN_PERM.READ,
  "/admin/community/abuse-policy": ADMIN_PERM.COMMUNITY_SUPER,
  "/admin/community/comments/visibility": ADMIN_PERM.COMMUNITY_MODERATE,
  "/admin/community/appeals/review": ADMIN_PERM.COMMUNITY_SUPER,
  "/admin/inbox": ADMIN_PERM.READ,
  "/admin/operator-guide": ADMIN_PERM.READ,
};

export function adminHomeCardRequiredPermission(href: string): AdminPermissionId {
  return ADMIN_HOME_CARD_REQUIRED_PERM[adminHomeCardLookupPath(href)] ?? ADMIN_PERM.READ;
}

export function filterAdminHomeCardsForCapabilities(
  cards: AdminHomeCard[],
  hasPermission: (perm: string) => boolean,
): AdminHomeCard[] {
  return cards.filter((c) => hasPermission(adminHomeCardRequiredPermission(c.href)));
}
