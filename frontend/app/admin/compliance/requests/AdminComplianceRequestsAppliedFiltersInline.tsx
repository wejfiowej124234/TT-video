"use client";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { useTranslation } from "@/components/LocaleProvider";

type AdminComplianceRequestsAppliedFiltersInlineProps = {
  id: string;
  appliedFilters: Record<string, unknown>;
};

export function AdminComplianceRequestsAppliedFiltersInline({
  id,
  appliedFilters,
}: AdminComplianceRequestsAppliedFiltersInlineProps) {
  const { t } = useTranslation();

  return (
    <AdminAppliedFiltersBanner id={id} variant="inline" className="mt-2">
      {t("admin_compliance_requests_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
    </AdminAppliedFiltersBanner>
  );
}
