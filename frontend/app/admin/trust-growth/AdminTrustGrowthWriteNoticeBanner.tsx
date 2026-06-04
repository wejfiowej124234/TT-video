"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";

export function AdminTrustGrowthWriteNoticeBanner() {
  const { t } = useTranslation();

  return (
    <AdminNoticeBanner
      className="mt-4"
      tone="readonly"
      size="lg"
      message={t("admin_trust_growth_write_notice")}
    />
  );
}
