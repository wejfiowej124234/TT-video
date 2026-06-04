"use client";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import type { AdminApiVersionsPageViewModel } from "./useAdminApiVersionsPage";

type Props = { vm: AdminApiVersionsPageViewModel };

export function AdminApiVersionsFiltersTail({ vm }: Props) {
  const {
    t,
    adminFilterHintId,
    apiVersionsActiveVersionDescId,
    apiVersionsActiveStatusDescId,
    adminAppliedFiltersDescId,
    apiVersion,
    status,
    appliedFilters,
  } = vm;

  return (
    <>
      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_api_versions_filter_hint")}
      </p>
      {apiVersion ? (
        <p id={apiVersionsActiveVersionDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_api_versions_active_version").replace("{v}", apiVersion)}
        </p>
      ) : null}
      {status ? (
        <p id={apiVersionsActiveStatusDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_api_versions_active_status").replace("{s}", status)}
        </p>
      ) : null}
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_api_versions_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}
    </>
  );
}
