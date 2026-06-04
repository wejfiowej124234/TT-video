"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type AdminInternalToolAuditsStatusBlockProps = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
};

export function AdminInternalToolAuditsStatusBlock({ loading, error }: AdminInternalToolAuditsStatusBlockProps) {
  const { t } = useTranslation();

  return (
    <>
      {loading ? <AdminListLoadingStatus message={t("admin_tool_audits_loading")} /> : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}
    </>
  );
}
