/** `/admin` 首页卡片与 ① 开发期 API 对照（业务文案见 i18n；路径仅 dev 折叠区）。 */

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { adminHomeCardTierForHref } from "./adminHomeCardCapability";

export type AdminHomeCardTier = "read" | "write" | "super_write" | "placeholder";

export type AdminHomeSectionId = "onboarding" | "ops_planes" | "core" | "audit_finance" | "community" | "platform";

export type AdminHomeInboxKey = "provider" | "guide" | "steward" | "approvals" | "reports";

export type AdminHomeCard = {
  href: string;
  titleKey: string;
  descKey: string;
  section: AdminHomeSectionId;
  inboxKey?: AdminHomeInboxKey;
  /** ① L5：能力分级徽章（非 70 完整 RBAC）。 */
  tier?: AdminHomeCardTier;
  /** 仅 `super_admin` 可见（与 API `require_super_admin` 子集对齐）。 */
  superAdminOnly?: boolean;
};

export const ADMIN_HOME_SECTION_ORDER: { id: AdminHomeSectionId; titleKey: string }[] = [
  { id: "onboarding", titleKey: "admin_home_section_onboarding" },
  { id: "ops_planes", titleKey: "admin_home_section_ops_planes" },
  { id: "core", titleKey: "admin_home_section_core" },
  { id: "audit_finance", titleKey: "admin_home_section_audit_finance" },
  { id: "community", titleKey: "admin_home_section_community" },
  { id: "platform", titleKey: "admin_home_section_platform" },
];

export const ADMIN_HOME_CARDS: AdminHomeCard[] = [
  {
    href: "/admin/inbox",
    titleKey: "admin_unified_inbox_nav_short",
    descKey: "admin_home_desc_unified_inbox",
    section: "onboarding",
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.provider,
    titleKey: "admin_provider_list_title",
    descKey: "admin_home_desc_provider_applications",
    section: "onboarding",
    inboxKey: "provider",
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.steward,
    titleKey: "admin_steward_list_title",
    descKey: "admin_home_desc_steward_applications",
    section: "onboarding",
    inboxKey: "steward",
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.approvals,
    titleKey: "admin_approvals_title",
    descKey: "admin_home_desc_approvals",
    section: "onboarding",
    inboxKey: "approvals",
  },
  {
    href: "/admin/onboarding",
    titleKey: "admin_onboarding_hub_title",
    descKey: "admin_home_desc_onboarding_hub",
    section: "onboarding",
  },
  {
    href: "/admin/onboarding/entitlements",
    titleKey: "admin_onb_entitlements_title",
    descKey: "admin_onb_entitlements_home_desc",
    section: "onboarding",
  },
  {
    href: "/admin/onboarding/payment-events",
    titleKey: "admin_onb_payment_events_title",
    descKey: "admin_onb_payment_events_subtitle_l5",
    section: "onboarding",
  },
  {
    href: "/admin/onboarding/webhook-jobs",
    titleKey: "admin_onboarding_hub_webhooks",
    descKey: "admin_onboarding_hub_webhooks_desc",
    section: "onboarding",
  },
  {
    href: "/admin/onboarding/compliance-audit",
    titleKey: "admin_onboarding_hub_compliance",
    descKey: "admin_onboarding_hub_compliance_desc",
    section: "onboarding",
  },
  {
    href: "/admin/operator-guide",
    titleKey: "admin_operator_guide_title",
    descKey: "admin_home_desc_operator_guide",
    section: "ops_planes",
  },
  {
    href: "/admin/content",
    titleKey: "admin_content_hub_title",
    descKey: "admin_home_desc_content_hub",
    section: "ops_planes",
  },
  {
    href: "/admin/content/countries",
    titleKey: "admin_content_countries_title",
    descKey: "admin_home_desc_content_countries_publish",
    section: "ops_planes",
  },
  {
    href: "/admin/official",
    titleKey: "admin_official_hub_title",
    descKey: "admin_home_desc_official_hub",
    section: "ops_planes",
  },
  {
    href: "/admin/growth",
    titleKey: "admin_growth_hub_title",
    descKey: "admin_home_desc_growth_hub",
    section: "ops_planes",
  },
  {
    href: "/admin/growth/analytics",
    titleKey: "admin_growth_analytics_title",
    descKey: "admin_home_desc_growth_analytics",
    section: "ops_planes",
  },
  {
    href: "/admin/permissions",
    titleKey: "admin_permissions_title",
    descKey: "admin_home_desc_permissions",
    section: "platform",
  },
  {
    href: "/admin/users#admin-acquisition-suspend",
    titleKey: "admin_home_acquisition_title",
    descKey: "admin_home_desc_acquisition_suspend",
    section: "onboarding",
  },
  { href: "/admin/users", titleKey: "admin_users_title", descKey: "admin_home_desc_users", section: "core" },
  { href: "/admin/guides", titleKey: "admin_guides_title", descKey: "admin_home_desc_guides", section: "core" },
  { href: "/admin/orders", titleKey: "admin_orders_title", descKey: "admin_home_desc_orders", section: "core" },
  { href: "/admin/disputes", titleKey: "admin_disputes_title", descKey: "admin_home_desc_disputes", section: "core" },
  { href: "/admin/reviews", titleKey: "admin_reviews_title", descKey: "admin_home_desc_reviews", section: "core" },
  { href: "/admin/audit", titleKey: "admin_audit_list_title", descKey: "admin_home_desc_audit_logs", section: "audit_finance" },
  {
    href: "/admin/auth-audit-events",
    titleKey: "admin_auth_audit_events_title",
    descKey: "admin_home_desc_auth_audit_events",
    section: "audit_finance",
  },
  {
    href: "/admin/finance-reconciliation",
    titleKey: "admin_finance_reconciliation_title",
    descKey: "admin_finance_reconciliation_home_desc",
    section: "audit_finance",
  },
  { href: "/admin/finance", titleKey: "admin_finance_title", descKey: "admin_home_desc_finance", section: "audit_finance" },
  { href: "/admin/fee-router", titleKey: "admin_fee_router_title", descKey: "admin_home_desc_fee_router", section: "audit_finance" },
  { href: "/admin/region-vault", titleKey: "admin_region_vault_title", descKey: "admin_home_desc_region_vault", section: "audit_finance" },
  { href: "/admin/observability", titleKey: "admin_observability_title", descKey: "admin_home_desc_observability", section: "audit_finance" },
  { href: "/admin/trust-growth", titleKey: "admin_trust_growth_title", descKey: "admin_home_desc_trust_growth", section: "audit_finance" },
  { href: "/admin/cross-check", titleKey: "admin_cross_check_title", descKey: "admin_home_desc_cross_check", section: "audit_finance" },
  { href: "/admin/drift-summary", titleKey: "admin_drift_summary_title", descKey: "admin_home_desc_drift_summary", section: "audit_finance" },
  { href: "/admin/audit/operations", titleKey: "admin_audit_ops_title", descKey: "admin_home_desc_audit_ops", section: "audit_finance" },
  { href: "/admin/alerts/incidents", titleKey: "admin_alert_incident_hub_title", descKey: "admin_home_desc_alert_incidents", section: "audit_finance" },
  { href: "/admin/indexer", titleKey: "admin_indexer_title", descKey: "admin_home_desc_indexer", section: "audit_finance" },
  {
    href: "/admin/indexer/reconcile-reports",
    titleKey: "admin_indexer_reconcile_reports_title",
    descKey: "admin_home_desc_reconcile_reports",
    section: "audit_finance",
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.reports,
    titleKey: "admin_community_reports_title",
    descKey: "admin_home_desc_community_reports",
    section: "community",
    inboxKey: "reports",
  },
  { href: "/admin/community/appeals", titleKey: "admin_appeals_title", descKey: "admin_home_desc_appeals", section: "community" },
  { href: "/admin/api-versions", titleKey: "admin_api_versions_title", descKey: "admin_home_desc_api_versions", section: "platform" },
  {
    href: "/admin/community/moderation/cases",
    titleKey: "admin_mod_cases_title",
    descKey: "admin_home_desc_mod_cases",
    section: "community",
  },
  { href: "/admin/community/risk-signals", titleKey: "admin_risk_signals_title", descKey: "admin_home_desc_risk_signals", section: "community" },
  {
    href: "/admin/community/policy-change-logs",
    titleKey: "admin_policy_logs_title",
    descKey: "admin_home_desc_policy_logs",
    section: "community",
  },
  {
    href: "/admin/community/ranking/snapshots",
    titleKey: "admin_rank_snapshots_title",
    descKey: "admin_home_desc_rank_snapshots",
    section: "community",
  },
  { href: "/admin/community/penalties", titleKey: "admin_penalties_title", descKey: "admin_home_desc_penalties", section: "community" },
  {
    href: "/admin/lifecycle",
    titleKey: "admin_lifecycle_title",
    descKey: "admin_home_desc_lifecycle",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/policies",
    titleKey: "admin_policies_title",
    descKey: "admin_home_desc_policies",
    section: "platform",
    superAdminOnly: true,
  },
  { href: "/admin/internal-tools/audits", titleKey: "admin_tool_audits_title", descKey: "admin_home_desc_tool_audits", section: "platform" },
  { href: "/admin/media/access-logs", titleKey: "admin_media_access_logs_title", descKey: "admin_home_desc_media_access_logs", section: "platform" },
  {
    href: "/admin/media/signed-url-tokens",
    titleKey: "admin_media_signed_url_tokens_title",
    descKey: "admin_home_desc_media_signed_url_tokens",
    section: "platform",
  },
  { href: "/admin/config", titleKey: "admin_config_hub_title", descKey: "admin_home_desc_config_hub", section: "platform" },
  {
    href: "/admin/flags",
    titleKey: "admin_flags_title",
    descKey: "admin_home_desc_flags",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/jobs",
    titleKey: "admin_jobs_title",
    descKey: "admin_home_desc_jobs",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/config/releases",
    titleKey: "admin_config_releases_title",
    descKey: "admin_home_desc_config_releases",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/secrets/metadata",
    titleKey: "admin_secrets_meta_title",
    descKey: "admin_home_desc_secrets_meta",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/scheduler/jobs",
    titleKey: "admin_scheduler_jobs_title",
    descKey: "admin_home_desc_scheduler_jobs",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/tenants/scopes",
    titleKey: "admin_tenant_scopes_title",
    descKey: "admin_home_desc_tenant_scopes",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/compliance",
    titleKey: "admin_compliance_hub_title",
    descKey: "admin_home_desc_compliance_hub",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/finance-suite",
    titleKey: "admin_fin_suite_title",
    descKey: "admin_home_desc_finance_suite",
    section: "audit_finance",
  },
  {
    href: "/admin/vacancy-ledger",
    titleKey: "admin_vacancy_ledger_ops_title",
    descKey: "admin_home_desc_vacancy_ledger_ops",
    section: "audit_finance",
  },
  {
    href: "/admin/compliance/requests",
    titleKey: "admin_compliance_requests_title",
    descKey: "admin_home_desc_compliance_requests",
    section: "platform",
    superAdminOnly: true,
  },
  {
    href: "/admin/community/abuse-policy",
    titleKey: "admin_abuse_title",
    descKey: "admin_home_desc_abuse_policy",
    section: "community",
    superAdminOnly: true,
  },
  {
    href: "/admin/community/comments/visibility",
    titleKey: "admin_comment_vis_title",
    descKey: "admin_home_desc_comment_vis",
    section: "community",
    superAdminOnly: true,
  },
  { href: "/admin/schema", titleKey: "admin_schema_title", descKey: "admin_home_desc_schema", section: "audit_finance" },
  { href: "/admin/backup", titleKey: "admin_backup_title", descKey: "admin_home_desc_backup", section: "platform" },
];

/** ① L5：合并能力表 tier（显式 `card.tier` 优先）。 */
export function resolveAdminHomeCardTier(card: AdminHomeCard): AdminHomeCardTier {
  return adminHomeCardTierForHref(card.href, card.tier);
}

/** Dev 折叠区：href → REST 路径（① 本地对照，非用户主文案）。 */
export const ADMIN_HOME_DEV_API_BY_HREF: Record<string, string> = {
  "/admin/onboarding": "GET /api/v1/admin/onboarding/*（枢纽）",
  "/admin/onboarding/entitlements": "GET /api/v1/admin/onboarding/entitlements",
  "/admin/onboarding/webhook-jobs": "GET /api/v1/admin/onboarding/webhook-jobs",
  "/admin/onboarding/payment-events": "GET /api/v1/admin/onboarding/payment-events",
  "/admin/onboarding/compliance-audit": "GET /api/v1/admin/onboarding/compliance-audit-events",
  "/admin/permissions": "GET /api/v1/admin/capabilities",
  "/admin/users#admin-acquisition-suspend": "PATCH /api/v1/admin/users/:id/acquisition-publish-suspend",
  "/admin/provider-applications": "GET /api/v1/admin/provider-applications",
  "/admin/steward-applications": "GET /api/v1/admin/steward-applications",
  "/admin/approvals": "GET /api/v1/admin/approvals",
  "/admin/users": "GET /api/v1/admin/users",
  "/admin/guides": "GET /api/v1/admin/guides",
  "/admin/orders": "GET /api/v1/admin/orders",
  "/admin/disputes": "GET /api/v1/admin/disputes",
  "/admin/reviews": "GET /api/v1/admin/reviews",
  "/admin/audit": "GET /api/v1/admin/audit-logs",
  "/admin/auth-audit-events": "GET /api/v1/admin/auth-audit-events",
  "/admin/finance-reconciliation": "GET /api/v1/admin/finance/reconciliation/*",
  "/admin/finance": "GET /api/v1/admin/finance/summary",
  "/admin/fee-router": "GET /api/v1/admin/fee-router/routed-events",
  "/admin/region-vault": "GET /api/v1/admin/region-vault/forwarded-events",
  "/admin/observability": "GET /api/v1/admin/observability/overview",
  "/admin/trust-growth": "GET /api/v1/admin/trust-growth/*",
  "/admin/cross-check": "GET /api/v1/admin/cross-check",
  "/admin/drift-summary": "GET /api/v1/admin/drift-summary",
  "/admin/audit/operations": "GET /api/v1/admin/audit/operations",
  "/admin/alerts/incidents": "GET /api/v1/admin/alerts/incidents/*",
  "/admin/indexer": "GET /api/v1/admin/indexer/health",
  "/admin/indexer/reconcile-reports": "GET /api/v1/admin/indexer/reconcile-reports",
  "/admin/schema": "GET /api/v1/admin/schema/migrations",
  "/admin/backup": "GET /api/v1/admin/platform/backup-status",
  "/admin/community/reports": "GET /api/v1/admin/community/reports",
  "/admin/community/appeals": "GET /api/v1/admin/community/appeals",
  "/admin/api-versions": "GET /api/v1/admin/api-versions",
  "/admin/community/moderation/cases": "GET /api/v1/admin/community/moderation/cases",
  "/admin/community/risk-signals": "GET /api/v1/admin/community/risk-signals",
  "/admin/community/policy-change-logs": "GET /api/v1/admin/community/policy-change-logs",
  "/admin/community/ranking/snapshots": "GET /api/v1/admin/community/ranking/snapshots",
  "/admin/community/penalties": "GET /api/v1/admin/community/penalties",
  "/admin/community/comments/visibility": "PATCH /api/v1/admin/community/comments/:id",
  "/admin/community/abuse-policy": "PATCH /api/v1/admin/community/abuse-policy",
  "/admin/lifecycle": "GET /api/v1/admin/lifecycle/state-machines",
  "/admin/policies": "GET /api/v1/admin/policies",
  "/admin/internal-tools/audits": "GET /api/v1/admin/internal-tools/audits",
  "/admin/media/access-logs": "GET /api/v1/admin/media/access-logs",
  "/admin/media/signed-url-tokens": "GET /api/v1/admin/media/signed-url-tokens",
  "/admin/config": "（配置中心导航）",
  "/admin/flags": "GET /api/v1/admin/flags",
  "/admin/jobs": "GET /api/v1/admin/jobs",
  "/admin/config/releases": "GET /api/v1/admin/config/releases",
  "/admin/secrets/metadata": "GET /api/v1/admin/secrets/metadata",
  "/admin/scheduler/jobs": "GET /api/v1/admin/scheduler/jobs",
  "/admin/tenants/scopes": "GET /api/v1/admin/tenants/scopes",
  "/admin/compliance/requests": "GET /api/v1/admin/compliance/data-requests",
};

export function adminHomeCardsBySection(cards: AdminHomeCard[] = ADMIN_HOME_CARDS): Map<AdminHomeSectionId, AdminHomeCard[]> {
  const m = new Map<AdminHomeSectionId, AdminHomeCard[]>();
  for (const { id } of ADMIN_HOME_SECTION_ORDER) m.set(id, []);
  for (const c of cards) m.get(c.section)!.push(c);
  return m;
}
