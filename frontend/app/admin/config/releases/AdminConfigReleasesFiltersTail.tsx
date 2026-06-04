"use client";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import type { AdminConfigReleasesPageViewModel } from "./useAdminConfigReleasesPage";

type Props = { vm: AdminConfigReleasesPageViewModel };

export function AdminConfigReleasesFiltersTail({ vm }: Props) {
  const {
    t,
    adminFilterHintId,
    configReleasesActiveKeyDescId,
    configReleasesActiveStatusDescId,
    adminAppliedFiltersDescId,
    releaseKey,
    status,
    appliedFilters,
  } = vm;

  return (
    <>
      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_config_releases_filter_hint")}
      </p>

      {releaseKey ? (
        <p id={configReleasesActiveKeyDescId} className="mt-2 text-meta text-ink-600">
          {t("admin_config_releases_active_release_key", { key: releaseKey, colon: t("market_fin_colon") })}
        </p>
      ) : null}
      {status ? (
        <p id={configReleasesActiveStatusDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_config_releases_active_status", { status, colon: t("market_fin_colon") })}
        </p>
      ) : null}
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_config_releases_applied")}
          {t("market_fin_colon")}
          {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}
    </>
  );
}
