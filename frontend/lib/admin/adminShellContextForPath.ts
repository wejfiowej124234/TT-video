/** Shell 分组 ↔ pathname 前缀（与 `AdminShellBar` 同源 · P-04 面包屑）。 */

export type AdminShellGroupId =
  | "workspace"
  | "onboarding"
  | "operations"
  | "content"
  | "official_ops"
  | "growth"
  | "community"
  | "finance"
  | "governance"
  | "more";

export type AdminShellContext = {
  groupId: AdminShellGroupId;
  groupLabelKey: string;
};

const PREFIX_GROUPS: { prefix: string; groupId: AdminShellGroupId; groupLabelKey: string }[] = [
  { prefix: "/admin/inbox", groupId: "workspace", groupLabelKey: "admin_shell_sidebar_hub_group" },
  { prefix: "/admin/provider-applications", groupId: "onboarding", groupLabelKey: "admin_shell_nav_group_onboarding" },
  { prefix: "/admin/guide-applications", groupId: "onboarding", groupLabelKey: "admin_shell_nav_group_onboarding" },
  { prefix: "/admin/steward-applications", groupId: "onboarding", groupLabelKey: "admin_shell_nav_group_onboarding" },
  { prefix: "/admin/approvals", groupId: "onboarding", groupLabelKey: "admin_shell_nav_group_onboarding" },
  { prefix: "/admin/onboarding", groupId: "onboarding", groupLabelKey: "admin_shell_nav_group_onboarding" },
  { prefix: "/admin/permissions", groupId: "more", groupLabelKey: "admin_permissions_title" },
  { prefix: "/admin/users", groupId: "operations", groupLabelKey: "admin_shell_nav_group_operations" },
  { prefix: "/admin/guides", groupId: "operations", groupLabelKey: "admin_shell_nav_group_operations" },
  { prefix: "/admin/orders", groupId: "operations", groupLabelKey: "admin_shell_nav_group_operations" },
  { prefix: "/admin/disputes", groupId: "operations", groupLabelKey: "admin_shell_nav_group_operations" },
  { prefix: "/admin/reviews", groupId: "operations", groupLabelKey: "admin_shell_nav_group_operations" },
  { prefix: "/admin/content", groupId: "content", groupLabelKey: "admin_shell_nav_group_content" },
  { prefix: "/admin/official", groupId: "official_ops", groupLabelKey: "admin_shell_nav_group_official_ops" },
  { prefix: "/admin/growth", groupId: "growth", groupLabelKey: "admin_shell_nav_group_growth" },
  { prefix: "/admin/conversion-analytics", groupId: "growth", groupLabelKey: "admin_shell_nav_group_growth" },
  { prefix: "/admin/region-share/reconcile", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/region-share", groupId: "governance", groupLabelKey: "admin_shell_nav_group_governance" },
  { prefix: "/admin/governance", groupId: "governance", groupLabelKey: "admin_shell_nav_group_governance" },
  { prefix: "/admin/community", groupId: "community", groupLabelKey: "admin_shell_nav_group_community" },
  { prefix: "/admin/finance-reconciliation", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/finance", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/fee-router", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/indexer", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/vacancy-ledger", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/finance-suite", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/region-vault", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/cross-check", groupId: "governance", groupLabelKey: "admin_shell_nav_group_governance" },
  { prefix: "/admin/drift-summary", groupId: "governance", groupLabelKey: "admin_shell_nav_group_governance" },
  { prefix: "/admin/trust-growth", groupId: "governance", groupLabelKey: "admin_shell_nav_group_governance" },
  { prefix: "/admin/observability", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/audit", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/config", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/compliance", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/schema", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/backup", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/flags", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/policies", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/jobs", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/lifecycle", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/api-versions", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/scheduler", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/secrets", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/tenants", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/media", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/internal-tools", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/alerts", groupId: "finance", groupLabelKey: "admin_shell_nav_group_finance" },
  { prefix: "/admin/auth-audit-events", groupId: "more", groupLabelKey: "admin_shell_nav_group_more" },
  { prefix: "/admin/operator-guide", groupId: "workspace", groupLabelKey: "admin_shell_nav_workspace" },
];

/** 最长前缀匹配当前 Shell 分组。 */
export function adminShellContextForPath(pathname: string): AdminShellContext | null {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/admin") {
    return { groupId: "workspace", groupLabelKey: "admin_shell_nav_workspace" };
  }
  if (!path.startsWith("/admin")) return null;

  let best: (typeof PREFIX_GROUPS)[number] | null = null;
  for (const row of PREFIX_GROUPS) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      if (!best || row.prefix.length > best.prefix.length) best = row;
    }
  }
  return best ? { groupId: best.groupId, groupLabelKey: best.groupLabelKey } : null;
}

const DETAIL_LEAF_RULES: { prefix: string; labelKey: string }[] = [
  { prefix: "/admin/users/", labelKey: "admin_user_detail_title" },
  { prefix: "/admin/approvals/", labelKey: "admin_approval_detail_title" },
  { prefix: "/admin/orders/", labelKey: "admin_order_detail_title" },
  { prefix: "/admin/disputes/", labelKey: "admin_dispute_detail_title" },
  { prefix: "/admin/guides/", labelKey: "admin_guide_detail_title" },
  { prefix: "/admin/reviews/", labelKey: "admin_review_detail_title" },
  { prefix: "/admin/audit/logs/", labelKey: "admin_audit_detail_title" },
  { prefix: "/admin/alerts/incidents/", labelKey: "admin_alert_incident_detail_title" },
  { prefix: "/admin/config/releases/", labelKey: "admin_config_release_detail_title" },
  { prefix: "/admin/indexer/reconcile/", labelKey: "admin_indexer_reconcile_title" },
  { prefix: "/admin/onboarding/entitlements/", labelKey: "admin_onboarding_entitlement_detail_title" },
];

/** 多级详情路径（SHELL-03 · DSAR 事件/更新等）。 */
const NESTED_LEAF_RULES: { pattern: RegExp; labelKey: string }[] = [
  {
    pattern: /^\/admin\/compliance\/requests\/[^/]+\/events\/?$/,
    labelKey: "admin_compliance_events_title",
  },
  {
    pattern: /^\/admin\/compliance\/requests\/[^/]+\/update\/?$/,
    labelKey: "admin_compliance_update_title",
  },
  {
    pattern: /^\/admin\/community\/appeals\/review\/?$/,
    labelKey: "admin_appeal_review_title",
  },
];

const LIST_LEAF_KEYS: { prefix: string; labelKey: string }[] = [
  { prefix: "/admin/provider-applications", labelKey: "admin_provider_list_title" },
  { prefix: "/admin/guide-applications", labelKey: "admin_guide_list_title" },
  { prefix: "/admin/steward-applications", labelKey: "admin_steward_list_title" },
  { prefix: "/admin/approvals", labelKey: "admin_approvals_title" },
  { prefix: "/admin/onboarding", labelKey: "admin_onboarding_hub_title" },
  { prefix: "/admin/permissions", labelKey: "admin_permissions_title" },
  { prefix: "/admin/users", labelKey: "admin_users_title" },
  { prefix: "/admin/guides", labelKey: "admin_guides_title" },
  { prefix: "/admin/orders", labelKey: "admin_orders_title" },
  { prefix: "/admin/disputes", labelKey: "admin_disputes_title" },
  { prefix: "/admin/reviews", labelKey: "admin_reviews_title" },
  { prefix: "/admin/community/reports", labelKey: "admin_community_reports_title" },
  { prefix: "/admin/community/penalties", labelKey: "admin_penalties_title" },
  { prefix: "/admin/community/appeals", labelKey: "admin_appeals_title" },
  { prefix: "/admin/content", labelKey: "admin_content_hub_title" },
  { prefix: "/admin/content/countries", labelKey: "admin_content_countries_title" },
  { prefix: "/admin/content/cities", labelKey: "admin_content_cities_title" },
  { prefix: "/admin/content/pois", labelKey: "admin_content_pois_title" },
  { prefix: "/admin/content/pricing", labelKey: "admin_content_pricing_title" },
  { prefix: "/admin/content/hotel-tiers", labelKey: "admin_content_hotel_tiers_title" },
  { prefix: "/admin/content/transport-region-rules", labelKey: "admin_content_transport_rules_title" },
  { prefix: "/admin/content/intercity-routes", labelKey: "admin_content_routes_title" },
  { prefix: "/admin/content/media-assets", labelKey: "admin_content_media_assets_title" },
  { prefix: "/admin/content/translation", labelKey: "admin_content_translation_title" },
  { prefix: "/admin/content/seo", labelKey: "admin_content_seo_title" },
  { prefix: "/admin/content/announcements", labelKey: "admin_content_announcements_title" },
  { prefix: "/admin/content/roadmap", labelKey: "admin_content_roadmap_title" },
  { prefix: "/admin/content/landing-ambient", labelKey: "admin_content_landing_ambient_title" },
  { prefix: "/admin/content/poi-images", labelKey: "admin_content_poi_images_title" },
  { prefix: "/admin/content/publish-queue", labelKey: "admin_content_publish_queue_title" },
  { prefix: "/admin/content/revisions", labelKey: "admin_content_revisions_title" },
  { prefix: "/admin/content/import-operations", labelKey: "admin_content_import_ops_title" },
  { prefix: "/admin/content/catalog-dashboard", labelKey: "admin_content_catalog_dashboard_title" },
  { prefix: "/admin/content/geo-validation", labelKey: "admin_content_geo_validation_title" },
  { prefix: "/admin/content/country-market", labelKey: "admin_country_market_title" },
  { prefix: "/admin/official", labelKey: "admin_official_hub_title" },
  { prefix: "/admin/official/accounts", labelKey: "admin_official_accounts_title" },
  { prefix: "/admin/official/guides", labelKey: "admin_official_guides_title" },
  { prefix: "/admin/official/itinerary-templates", labelKey: "admin_official_itinerary_templates_title" },
  { prefix: "/admin/official/cold-start", labelKey: "admin_official_cold_start_title" },
  { prefix: "/admin/growth", labelKey: "admin_growth_hub_title" },
  { prefix: "/admin/growth/referral-codes", labelKey: "admin_growth_referral_codes_title" },
  { prefix: "/admin/growth/early-bird", labelKey: "admin_growth_early_bird_title" },
  { prefix: "/admin/growth/airdrop-campaigns", labelKey: "admin_growth_airdrop_campaigns_title" },
  { prefix: "/admin/growth/kol-center", labelKey: "admin_growth_kol_title" },
  { prefix: "/admin/growth/reward-ledger", labelKey: "admin_growth_reward_ledger_title" },
  { prefix: "/admin/growth/anti-fraud", labelKey: "admin_growth_anti_fraud_title" },
  { prefix: "/admin/growth/analytics", labelKey: "admin_growth_analytics_title" },
  { prefix: "/admin/conversion-analytics", labelKey: "pes3_admin_page_title" },
  { prefix: "/admin/community/moderation/cases", labelKey: "admin_mod_cases_title" },
  { prefix: "/admin/community/risk-signals", labelKey: "admin_risk_signals_title" },
  { prefix: "/admin/community/policy-change-logs", labelKey: "admin_policy_logs_title" },
  { prefix: "/admin/community/ranking/snapshots", labelKey: "admin_rank_snapshots_title" },
  { prefix: "/admin/governance/execution-uat", labelKey: "admin_governance_execution_uat_title" },
  { prefix: "/admin/region-share/reconcile", labelKey: "admin_region_share_reconcile_title" },
  { prefix: "/admin/finance-suite", labelKey: "admin_finance_suite_title" },
  { prefix: "/admin/finance-reconciliation", labelKey: "admin_finance_reconciliation_title" },
  { prefix: "/admin/fee-router", labelKey: "admin_fee_router_title" },
  { prefix: "/admin/finance", labelKey: "admin_finance_title" },
  { prefix: "/admin/cross-check", labelKey: "admin_cross_check_title" },
  { prefix: "/admin/drift-summary", labelKey: "admin_drift_summary_title" },
  { prefix: "/admin/trust-growth", labelKey: "admin_trust_growth_title" },
  { prefix: "/admin/indexer/reconcile-reports", labelKey: "admin_indexer_reconcile_reports_title" },
  { prefix: "/admin/vacancy-ledger", labelKey: "admin_vacancy_ledger_ops_title" },
  { prefix: "/admin/indexer", labelKey: "admin_indexer_title" },
  { prefix: "/admin/alerts/incidents", labelKey: "admin_alert_incident_hub_title" },
  { prefix: "/admin/auth-audit-events", labelKey: "admin_auth_audit_events_title" },
  { prefix: "/admin/inbox", labelKey: "admin_unified_inbox_title" },
  { prefix: "/admin/compliance/requests", labelKey: "admin_compliance_requests_title" },
  { prefix: "/admin/compliance", labelKey: "admin_compliance_hub_title" },
  { prefix: "/admin/config/releases", labelKey: "admin_config_releases_title" },
  { prefix: "/admin/config", labelKey: "admin_config_hub_title" },
  { prefix: "/admin/flags", labelKey: "admin_flags_title" },
  { prefix: "/admin/policies", labelKey: "admin_policies_title" },
  { prefix: "/admin/secrets/metadata", labelKey: "admin_secrets_metadata_title" },
  { prefix: "/admin/tenants/scopes", labelKey: "admin_tenant_scopes_title" },
  { prefix: "/admin/audit", labelKey: "admin_audit_list_title" },
  { prefix: "/admin/schema", labelKey: "admin_schema_title" },
  { prefix: "/admin/backup", labelKey: "admin_backup_title" },
  { prefix: "/admin/observability", labelKey: "admin_observability_title" },
  { prefix: "/admin/operator-guide", labelKey: "admin_operator_guide_title" },
];

function normalizeAdminPath(pathname: string): string {
  const path = (pathname.split("?")[0] ?? pathname).replace(/\/+$/, "");
  return path || "/admin";
}

/** 面包屑第三段：当前页标题 i18n key（SHELL-03）。 */
export function adminBreadcrumbLeafForPath(pathname: string): string | null {
  const path = normalizeAdminPath(pathname);
  if (path === "/admin") return null;

  for (const rule of NESTED_LEAF_RULES) {
    if (rule.pattern.test(path)) return rule.labelKey;
  }

  for (const rule of DETAIL_LEAF_RULES) {
    const rest = path.slice(rule.prefix.length);
    if (path.startsWith(rule.prefix) && rest.length > 0 && !rest.includes("/")) {
      return rule.labelKey;
    }
  }

  let best: (typeof LIST_LEAF_KEYS)[number] | null = null;
  for (const row of LIST_LEAF_KEYS) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      if (!best || row.prefix.length > best.prefix.length) best = row;
    }
  }
  return best?.labelKey ?? null;
}
