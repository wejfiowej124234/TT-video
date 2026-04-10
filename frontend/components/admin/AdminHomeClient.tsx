"use client";

import Link from "next/link";
import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type AdminHomeSectionId = "core" | "audit_finance" | "community" | "platform";

const ADMIN_HOME_CARDS: { href: string; titleKey: string; descKey: string; section: AdminHomeSectionId }[] = [
  { href: "/admin/users", titleKey: "admin_users_title", descKey: "admin_home_desc_users", section: "core" },
  { href: "/admin/guides", titleKey: "admin_guides_title", descKey: "admin_home_desc_guides", section: "core" },
  { href: "/admin/orders", titleKey: "admin_orders_title", descKey: "admin_home_desc_orders", section: "core" },
  { href: "/admin/disputes", titleKey: "admin_disputes_title", descKey: "admin_home_desc_disputes", section: "core" },
  { href: "/admin/reviews", titleKey: "admin_reviews_title", descKey: "admin_home_desc_reviews", section: "core" },
  { href: "/admin/audit", titleKey: "admin_audit_list_title", descKey: "admin_home_desc_audit_logs", section: "audit_finance" },
  { href: "/admin/approvals", titleKey: "admin_approvals_title", descKey: "admin_home_desc_approvals", section: "audit_finance" },
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
  { href: "/admin/schema", titleKey: "admin_schema_title", descKey: "admin_home_desc_schema", section: "audit_finance" },
  { href: "/admin/community/reports", titleKey: "admin_community_reports_title", descKey: "admin_home_desc_community_reports", section: "community" },
  { href: "/admin/community/appeals", titleKey: "admin_appeals_title", descKey: "admin_home_desc_appeals", section: "community" },
  { href: "/admin/api-versions", titleKey: "admin_api_versions_title", descKey: "admin_home_desc_api_versions", section: "platform" },
  { href: "/admin/community/moderation/cases", titleKey: "admin_mod_cases_title", descKey: "admin_home_desc_mod_cases", section: "community" },
  { href: "/admin/community/risk-signals", titleKey: "admin_risk_signals_title", descKey: "admin_home_desc_risk_signals", section: "community" },
  { href: "/admin/community/policy-change-logs", titleKey: "admin_policy_logs_title", descKey: "admin_home_desc_policy_logs", section: "community" },
  { href: "/admin/community/ranking/snapshots", titleKey: "admin_rank_snapshots_title", descKey: "admin_home_desc_rank_snapshots", section: "community" },
  { href: "/admin/community/penalties", titleKey: "admin_penalties_title", descKey: "admin_home_desc_penalties", section: "community" },
  { href: "/admin/community/comments/visibility", titleKey: "admin_comment_vis_title", descKey: "admin_home_desc_comment_vis", section: "community" },
  { href: "/admin/community/abuse-policy", titleKey: "admin_abuse_title", descKey: "admin_home_desc_abuse_policy", section: "community" },
  { href: "/admin/lifecycle", titleKey: "admin_lifecycle_title", descKey: "admin_home_desc_lifecycle", section: "platform" },
  { href: "/admin/policies", titleKey: "admin_policies_title", descKey: "admin_home_desc_policies", section: "platform" },
  { href: "/admin/internal-tools/audits", titleKey: "admin_tool_audits_title", descKey: "admin_home_desc_tool_audits", section: "platform" },
  { href: "/admin/media/access-logs", titleKey: "admin_media_access_logs_title", descKey: "admin_home_desc_media_access_logs", section: "platform" },
  { href: "/admin/media/signed-url-tokens", titleKey: "admin_media_signed_url_tokens_title", descKey: "admin_home_desc_media_signed_url_tokens", section: "platform" },
  { href: "/admin/config", titleKey: "admin_config_hub_title", descKey: "admin_home_desc_config_hub", section: "platform" },
  { href: "/admin/flags", titleKey: "admin_flags_title", descKey: "admin_home_desc_flags", section: "platform" },
  { href: "/admin/jobs", titleKey: "admin_jobs_title", descKey: "admin_home_desc_jobs", section: "platform" },
  { href: "/admin/config/releases", titleKey: "admin_config_releases_title", descKey: "admin_home_desc_config_releases", section: "platform" },
  { href: "/admin/secrets/metadata", titleKey: "admin_secrets_meta_title", descKey: "admin_home_desc_secrets_meta", section: "platform" },
  { href: "/admin/scheduler/jobs", titleKey: "admin_scheduler_jobs_title", descKey: "admin_home_desc_scheduler_jobs", section: "platform" },
  { href: "/admin/tenants/scopes", titleKey: "admin_tenant_scopes_title", descKey: "admin_home_desc_tenant_scopes", section: "platform" },
  { href: "/admin/compliance/requests", titleKey: "admin_compliance_requests_title", descKey: "admin_home_desc_compliance_requests", section: "platform" },
];

const SECTION_ORDER: { id: AdminHomeSectionId; titleKey: string }[] = [
  { id: "core", titleKey: "admin_home_section_core" },
  { id: "audit_finance", titleKey: "admin_home_section_audit_finance" },
  { id: "community", titleKey: "admin_home_section_community" },
  { id: "platform", titleKey: "admin_home_section_platform" },
];

const ADMIN_HOME_BY_SECTION: Map<AdminHomeSectionId, (typeof ADMIN_HOME_CARDS)[number][]> = (() => {
  const m = new Map<AdminHomeSectionId, (typeof ADMIN_HOME_CARDS)[number][]>();
  for (const { id } of SECTION_ORDER) m.set(id, []);
  for (const c of ADMIN_HOME_CARDS) m.get(c.section)!.push(c);
  return m;
})();

/** `/admin` 首页：按 70 域分组；卡片文案与各子页 `*_title` 一致（37 / 63 / 70） */
export default function AdminHomeClient() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminHomeMetaBuild");

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
              {t("admin_workspace_title")}
            </h1>
            <p className="mt-2 text-body text-ink-600">{t("admin_workspace_subtitle")}</p>
          </div>
          <div className="flex max-w-md flex-col items-end gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-end">
            <Link
              href="/admin/observability"
              className={`${touchTargetLink44Classes} shrink-0 text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_observability_title")}
            </Link>
            <span className="hidden text-ink-300 sm:inline" aria-hidden>
              ·
            </span>
            <Link
              href="/admin/cross-check"
              title={t("admin_audit_tools_read_only_scope")}
              className={`${touchTargetLink44Classes} shrink-0 text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_shell_nav_cross_check")}
            </Link>
            <span className="hidden text-ink-300 sm:inline" aria-hidden>
              ·
            </span>
            <Link
              href="/admin/drift-summary"
              title={t("admin_audit_tools_read_only_scope")}
              className={`${touchTargetLink44Classes} shrink-0 text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_shell_nav_drift_summary")}
            </Link>
          </div>
        </div>
      </header>

      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <div className="mt-8 space-y-10" aria-label={t("admin_home_modules_aria")}>
        {SECTION_ORDER.map(({ id, titleKey }) => {
          const cards = ADMIN_HOME_BY_SECTION.get(id) ?? [];
          if (cards.length === 0) return null;
          const sectionHeadingId = `${pageTitleId}-${id}`;
          return (
            <section key={id} className="space-y-3" aria-labelledby={sectionHeadingId}>
              <h2 id={sectionHeadingId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t(titleKey)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {cards.map(({ href, titleKey: tk, descKey }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
                  >
                    <h3 className="text-body-l font-medium">{t(tk)}</h3>
                    <p className="mt-1 text-small text-ink-600">{t(descKey)}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
