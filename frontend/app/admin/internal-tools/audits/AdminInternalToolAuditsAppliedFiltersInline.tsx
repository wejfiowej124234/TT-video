"use client";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { useTranslation } from "@/components/LocaleProvider";

type AdminInternalToolAuditsAppliedFiltersInlineProps = {
  id: string;
  appliedFilters: Record<string, unknown>;
};

export function AdminInternalToolAuditsAppliedFiltersInline({
  id,
  appliedFilters,
}: AdminInternalToolAuditsAppliedFiltersInlineProps) {
  const { t } = useTranslation();

  return (
    <AdminAppliedFiltersBanner id={id} variant="inline" className="mt-2">
      {t("admin_tool_audits_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
    </AdminAppliedFiltersBanner>
  );
}
