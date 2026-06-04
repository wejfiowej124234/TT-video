"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type AdminSchedulerJobsStatusBlockProps = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
};

export function AdminSchedulerJobsStatusBlock({ loading, error }: AdminSchedulerJobsStatusBlockProps) {
  const { t } = useTranslation();

  return (
    <>
      {loading ? <AdminListLoadingStatus message={t("admin_scheduler_jobs_loading")} /> : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}
    </>
  );
}
