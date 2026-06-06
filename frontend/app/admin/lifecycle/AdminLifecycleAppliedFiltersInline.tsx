"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { useTranslation } from "@/components/LocaleProvider";

type AdminLifecycleAppliedFiltersInlineProps = {
  id: string;
  appliedFilters: Record<string, unknown>;
};

export function AdminLifecycleAppliedFiltersInline({ id, appliedFilters }: AdminLifecycleAppliedFiltersInlineProps) {
  const { t } = useTranslation();

  return (
    <AdminAppliedFiltersBanner id={id} variant="inline" className="mt-2">
      {t("admin_lifecycle_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
    </AdminAppliedFiltersBanner>
  );
}
