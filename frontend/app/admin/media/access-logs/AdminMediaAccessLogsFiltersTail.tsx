"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";

import type { AdminMediaAccessLogsPageViewModel } from "./useAdminMediaAccessLogsPage";

type Props = {
  vm: AdminMediaAccessLogsPageViewModel;
  adminFilterHintId: string;
  adminAppliedFiltersDescId: string;
};

export function AdminMediaAccessLogsFiltersTail({ vm, adminFilterHintId, adminAppliedFiltersDescId }: Props) {
  const { t } = useTranslation();
  const { appliedFilters } = vm;

  return (
    <>
      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_media_access_logs_filter_hint")}
      </p>
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_media_access_logs_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}
    </>
  );
}
