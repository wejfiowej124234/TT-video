"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  ADMIN_TEXT_SECONDARY_CLASS,
  adminHubKpiLinkClass,
  ADMIN_HUB_LINK_CARD_INNER_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_CARD_CLASS,
} from "@/lib/adminUi";

import type { OfficialOpsHubStats } from "./useAdminOfficialOpsHubPage";

type Props = {
  stats: OfficialOpsHubStats | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

/** Official ops hub dashboard · clickable KPIs + quick-create (Batch-13 FP-D OO). */
export function AdminOfficialOpsHubDashboard({ stats, loading, error, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-tt-admin-official-hub-dashboard="1">
      <p className={`text-body-m ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_official_hub_body_os4")}</p>

      <section
        className={`flex flex-wrap gap-2 ${ADMIN_FILTER_CARD_CLASS}`}
        data-tt-admin-official-hub-quick-create="1"
        aria-label={t("admin_official_hub_quick_create_aria")}
      >
        <Link
          href="/admin/official/accounts#create"
          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          data-tt-admin-official-quick="accounts"
        >
          {t("admin_official_hub_quick_accounts")}
        </Link>
        <Link
          href="/admin/official/cold-start#create"
          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          data-tt-admin-official-quick="cold-start"
        >
          {t("admin_official_hub_quick_cold_start")}
        </Link>
        <Link
          href="/admin/official/itinerary-templates#create"
          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          data-tt-admin-official-quick="templates"
        >
          {t("admin_official_hub_quick_templates")}
        </Link>
      </section>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={onRetry}
        loadingMessageKey="admin_official_loading"
        empty={false}
      >
        {stats ? (
          <section
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            aria-label={t("admin_official_hub_kpi_aria")}
            data-tt-admin-official-hub-kpi="1"
          >
            <p
              className={`col-span-full text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}
              data-tt-admin-official-hub-kpi-honesty="1"
              role="note"
            >
              {t("admin_official_hub_kpi_sample_honesty", { limit: stats.sampleLimit })}
            </p>
            <Link
              href="/admin/official/accounts"
              className={adminHubKpiLinkClass()}
              data-tt-admin-official-hub-kpi-card="accounts"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_accounts")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.accounts}</p>
                <p className={`mt-1 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_sample_badge", { limit: stats.sampleLimit })}
                </p>
              </span>
            </Link>
            <Link
              href="/admin/official/guides"
              className={adminHubKpiLinkClass()}
              data-tt-admin-official-hub-kpi-card="guides"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_guides")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.guides}</p>
                <p className={`mt-1 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_sample_badge", { limit: stats.sampleLimit })}
                </p>
              </span>
            </Link>
            <Link
              href="/admin/official/itinerary-templates"
              className={adminHubKpiLinkClass()}
              data-tt-admin-official-hub-kpi-card="templates"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_templates")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.templates}</p>
                <p className={`mt-1 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_sample_badge", { limit: stats.sampleLimit })}
                </p>
              </span>
            </Link>
            <Link
              href="/admin/official/cold-start"
              className={adminHubKpiLinkClass()}
              data-tt-admin-official-hub-kpi-card="campaigns"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_campaigns")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.campaigns}</p>
                <p className={`mt-1 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_sample_badge", { limit: stats.sampleLimit })}
                </p>
              </span>
            </Link>
            <Link
              href="/admin/official/accounts?review=pending"
              className={adminHubKpiLinkClass()}
              data-tt-admin-official-hub-kpi-card="pending"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <p className={`text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_pending")}
                </p>
                <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.pendingReview}</p>
                <p className={`mt-1 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
                  {t("admin_official_hub_kpi_sample_badge", { limit: stats.sampleLimit })}
                </p>
              </span>
            </Link>
          </section>
        ) : null}
      </OpsPlaneFetchStates>
    </div>
  );
}
