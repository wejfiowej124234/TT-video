"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";

import type { AdminApprovalsPageViewModel } from "./useAdminApprovalsPage";

type Props = {
  vm: AdminApprovalsPageViewModel;
  adminAppliedFiltersDescId: string;
};

export function AdminApprovalsAppliedFiltersSection({ vm, adminAppliedFiltersDescId }: Props) {
  const { t } = useTranslation();
  const { loading, error, appliedFilters } = vm;

  if (loading || error || !appliedFilters) return null;

  return (
    <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
      {t("admin_approvals_applied")} {formatAdminAppliedFiltersHuman(appliedFilters, t)}
    </AdminAppliedFiltersBanner>
  );
}
