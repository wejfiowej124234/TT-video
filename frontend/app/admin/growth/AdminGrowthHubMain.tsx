"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { AdminOpsHubNavTiles } from "@/components/admin/ops/AdminOpsHubNavTiles";
import { ADMIN_SHELL_GROWTH_NAV_LINKS } from "@/lib/admin/adminShellGrowthNavLinks";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_HUB_LINK_CARD_INNER_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TEXT_SECONDARY_CLASS,
  adminHubKpiLinkClass,
} from "@/lib/adminUi";

import { useAdminGrowthHubPage } from "./useAdminGrowthHubPage";

/** Growth Center ops console home (101 · UX-P0-03 + S2 KPI · Batch-13 FP-D). */
export function AdminGrowthHubConsole() {
  const { t } = useTranslation();
  const { overview, loading, error, reload } = useAdminGrowthHubPage();

  return (
    <div data-tt-admin-growth-hub="1" className="space-y-6">
      <p className={`text-body-m ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_growth_hub_intro")}</p>

      <section
        className={`flex flex-wrap gap-2 ${ADMIN_FILTER_CARD_CLASS}`}
        data-tt-admin-growth-hub-quick-create="1"
      >
        <Link
          href="/admin/growth/referral-codes#create"
          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          data-tt-admin-growth-quick-referral="1"
        >
          {t("admin_growth_hub_quick_referral")}
        </Link>
      </section>

      <AdminOpsHubNavTiles
        links={ADMIN_SHELL_GROWTH_NAV_LINKS}
        dataTtAttr="data-tt-admin-growth-hub-link"
        showMoreFold
      />

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="admin_growth_hub_kpi_loading"
        empty={!loading && !error && !overview}
        emptyMessageKey="admin_growth_hub_kpi_empty"
        skeleton
      >
        {overview ? (
          <section
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            data-tt-admin-growth-hub-kpi="1"
            aria-label={t("admin_growth_hub_kpi_title")}
          >
            <Link
              href="/admin/growth/analytics"
              className={adminHubKpiLinkClass()}
              data-tt-admin-growth-kpi="registrations"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_growth_hub_kpi_registrations")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">
                  {overview.registrations_total}
                </p>
              </span>
            </Link>
            <Link
              href="/admin/growth/referral-codes"
              className={adminHubKpiLinkClass()}
              data-tt-admin-growth-kpi="referral_events"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_growth_hub_kpi_referral_events")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">
                  {overview.referral_events_total}
                </p>
                {overview.referral_events_total === 0 ? (
                  <p className={`mt-1 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                    {t("admin_growth_hub_referral_events_empty_hint")}
                  </p>
                ) : null}
              </span>
            </Link>
            <Link
              href="/admin/growth/reward-ledger"
              className={adminHubKpiLinkClass()}
              data-tt-admin-growth-kpi="points"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_growth_hub_kpi_points")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">
                  {overview.total_growth_points}
                </p>
              </span>
            </Link>
            <Link
              href="/admin/growth/referral-codes"
              className={adminHubKpiLinkClass()}
              data-tt-admin-growth-kpi="active_codes"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_growth_hub_kpi_active_codes")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">
                  {overview.referral_code_active_count}
                </p>
              </span>
            </Link>
          </section>
        ) : null}
      </OpsPlaneFetchStates>
    </div>
  );
}

export function AdminGrowthHubPageMain() {
  const { t } = useTranslation();
  const titleId = "admin-growth-hub-title";

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_growth_hub_title")}
      subtitle={t("admin_growth_hub_subtitle_s1")}
    >
      <AdminGrowthHubConsole />
    </AdminDetailPageChrome>
  );
}
