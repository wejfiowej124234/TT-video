"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { ADMIN_KPI_CARD_IDLE_CLASS } from "@/lib/adminUi";

import type { OfficialOpsHubStats } from "./useAdminOfficialOpsHubPage";

type Props = {
  stats: OfficialOpsHubStats | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function AdminOfficialOpsHubDashboard({ stats, loading, error, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-tt-admin-official-hub-dashboard="1">
      <p className="text-body-m text-ink-600">{t("admin_official_hub_body_os4")}</p>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={onRetry}
        loadingMessageKey="admin_official_loading"
        empty={false}
      >
        {stats ? (
          <section
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            aria-label={t("admin_official_hub_kpi_aria")}
            data-tt-admin-official-hub-kpi="1"
          >
            <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
              <p className="text-meta text-ink-500">{t("admin_official_hub_kpi_accounts")}</p>
              <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.accounts}</p>
            </div>
            <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
              <p className="text-meta text-ink-500">{t("admin_official_hub_kpi_guides")}</p>
              <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.guides}</p>
            </div>
            <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
              <p className="text-meta text-ink-500">{t("admin_official_hub_kpi_templates")}</p>
              <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.templates}</p>
            </div>
            <div className={ADMIN_KPI_CARD_IDLE_CLASS}>
              <p className="text-meta text-ink-500">{t("admin_official_hub_kpi_pending")}</p>
              <p className="mt-1 text-body-l font-semibold text-ink-900">{stats.pendingReview}</p>
            </div>
          </section>
        ) : null}
      </OpsPlaneFetchStates>
    </div>
  );
}
