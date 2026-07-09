import type { AdminHomeCardTier } from "./adminHomeModel";

/**
 * ① L5：首页卡片能力分级与 API `require_admin_actor` / `require_super_admin` 对拍。
 * ② 六角色 RBAC 落库后，由权限中心覆盖本表（见 spec 70 · ADM-U01）。
 */
export const ADMIN_HOME_CARD_TIER_BY_HREF: Record<string, AdminHomeCardTier> = {
  "/admin/provider-applications": "write",
  "/admin/steward-applications": "write",
  "/admin/approvals": "super_write",
  "/admin/onboarding": "read",
  "/admin/onboarding/entitlements": "read",
  "/admin/onboarding/webhook-jobs": "read",
  "/admin/onboarding/payment-events": "read",
  "/admin/onboarding/compliance-audit": "read",
  "/admin/permissions": "read",
  "/admin/users#admin-acquisition-suspend": "write",
  "/admin/users": "write",
  "/admin/guides": "write",
  "/admin/orders": "read",
  "/admin/disputes": "write",
  "/admin/reviews": "read",
  "/admin/audit": "read",
  "/admin/auth-audit-events": "read",
  "/admin/finance-reconciliation": "read",
  "/admin/finance": "read",
  "/admin/fee-router": "read",
  "/admin/region-vault": "read",
  "/admin/observability": "read",
  "/admin/trust-growth": "write",
  "/admin/cross-check": "read",
  "/admin/drift-summary": "read",
  "/admin/audit/operations": "read",
  "/admin/alerts/incidents": "read",
  "/admin/indexer": "read",
  "/admin/indexer/reconcile-reports": "read",
  "/admin/schema": "placeholder",
  "/admin/backup": "placeholder",
  "/admin/community/reports": "write",
  "/admin/community/appeals": "super_write",
  "/admin/community/moderation/cases": "read",
  "/admin/community/risk-signals": "read",
  "/admin/community/policy-change-logs": "read",
  "/admin/community/ranking/snapshots": "read",
  "/admin/community/penalties": "write",
  "/admin/api-versions": "read",
  "/admin/lifecycle": "super_write",
  "/admin/policies": "super_write",
  "/admin/internal-tools/audits": "read",
  "/admin/media/access-logs": "read",
  "/admin/media/signed-url-tokens": "read",
  "/admin/config": "read",
  "/admin/flags": "super_write",
  "/admin/jobs": "super_write",
  "/admin/config/releases": "super_write",
  "/admin/secrets/metadata": "super_write",
  "/admin/scheduler/jobs": "super_write",
  "/admin/tenants/scopes": "super_write",
  "/admin/compliance/requests": "super_write",
  "/admin/community/abuse-policy": "super_write",
  "/admin/community/comments/visibility": "super_write",
  "/admin/compliance": "read",
  "/admin/finance-suite": "read",
  "/admin/vacancy-ledger": "read",
};

/** 首页卡片 href 可能带 `?status=`（收件箱 SSOT）；lookup 用 pathname。 */
export function adminHomeCardLookupPath(href: string): string {
  const noHash = href.split("#")[0] ?? href;
  return noHash.split("?")[0] ?? noHash;
}

export function adminHomeCardTierForHref(href: string, explicit?: AdminHomeCardTier): AdminHomeCardTier {
  if (explicit) return explicit;
  return ADMIN_HOME_CARD_TIER_BY_HREF[adminHomeCardLookupPath(href)] ?? "read";
}
