"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { AdminOpsPlaneSidebarHint } from "@/components/admin/ops/AdminOpsPlaneSidebarHint";
import { ADMIN_KPI_CARD_IDLE_CLASS } from "@/lib/adminUi";

import { useAdminGrowthHubPage } from "./useAdminGrowthHubPage";

/** Growth Center ops console home (101 · UX-P0-03 + S2 KPI). */
export function AdminGrowthHubConsole() {
  const { t } = useTranslation();
  const { overview, loading, error, reload } = useAdminGrowthHubPage();

  return (
    <div data-tt-admin-growth-hub="1" className="space-y-6">
      <p className="text-body-m text-ink-600">{t("admin_growth_hub_intro")}</p>
      <AdminOpsPlaneSidebarHint />

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
            <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
              <p className="text-meta text-ink-500">{t("admin_growth_hub_kpi_registrations")}</p>
              <p className="mt-1 text-body-l font-semibold text-ink-900">
                {overview.registrations_total}
              </p>
            </div>
            <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
              <p className="text-meta text-ink-500">{t("admin_growth_hub_kpi_referral_events")}</p>
              <p className="mt-1 text-body-l font-semibold text-ink-900">
                {overview.referral_events_total}
              </p>
            </div>
            <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
              <p className="text-meta text-ink-500">{t("admin_growth_hub_kpi_points")}</p>
              <p className="mt-1 text-body-l font-semibold text-ink-900">
                {overview.total_growth_points}
              </p>
            </div>
            <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
              <p className="text-meta text-ink-500">{t("admin_growth_hub_kpi_active_codes")}</p>
              <p className="mt-1 text-body-l font-semibold text-ink-900">
                {overview.referral_code_active_count}
              </p>
            </div>
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
