"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { useTranslation } from "@/components/LocaleProvider";

type AdminSchedulerJobsAppliedFiltersBannerProps = {
  id: string;
  appliedFilters: Record<string, unknown>;
};

export function AdminSchedulerJobsAppliedFiltersBanner({
  id,
  appliedFilters,
}: AdminSchedulerJobsAppliedFiltersBannerProps) {
  const { t } = useTranslation();

  return (
    <AdminAppliedFiltersBanner id={id} variant="card" className="mt-6">
      {t("admin_scheduler_jobs_applied")}
      {t("market_fin_colon")}
      {formatAdminAppliedFiltersHuman(appliedFilters, t)}
    </AdminAppliedFiltersBanner>
  );
}
