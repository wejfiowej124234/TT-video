"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type AdminTrustGrowthLoadErrorBlockProps = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
};

export function AdminTrustGrowthLoadErrorBlock({ loading, error }: AdminTrustGrowthLoadErrorBlockProps) {
  const { t } = useTranslation();

  if (loading) {
    return <AdminListLoadingStatus message={t("admin_trust_growth_loading")} className="mt-6 text-body text-ink-600" />;
  }
  if (error) {
    return (
      <AdminListFetchError className="mt-6" errorKind={error} message={adminErrorUserText(error, t)} />
    );
  }
  return null;
}
