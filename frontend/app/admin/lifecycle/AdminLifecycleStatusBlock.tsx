"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type AdminLifecycleStatusBlockProps = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
};

export function AdminLifecycleStatusBlock({ loading, error }: AdminLifecycleStatusBlockProps) {
  const { t } = useTranslation();

  return (
    <>
      {loading ? <AdminListLoadingStatus message={t("admin_lifecycle_loading")} /> : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}
    </>
  );
}
