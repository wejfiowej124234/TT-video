"use client";

import { useTranslation } from "@/components/LocaleProvider";
import AdminAuditCompareLinks from "@/components/admin/AdminAuditCompareLinks";
import { AdminHomeOperatorGuide } from "@/components/admin/AdminHomeOperatorGuide";
import { AdminHomeOpsRoleGuide } from "@/components/admin/AdminHomeOpsRoleGuide";
import { AdminHomePhase2PrepNotice } from "@/components/admin/AdminHomePhase2PrepNotice";

/** ① 维护者折叠：手册、搜索、Staging 预备（非运营主路径）。 */
export function AdminHomeMaintainerFold() {
  const { t } = useTranslation();

  return (
    <details
      className="rounded-[var(--radius-xl)] border border-ink-200 bg-ink-50/40 p-4"
      data-tt-admin-home-maintainer-fold="1"
    >
      <summary className="cursor-pointer text-small font-medium text-ink-700 marker:content-none [&::-webkit-details-marker]:hidden">
        {t("admin_home_maintainer_fold_summary")}
      </summary>
      <div className="mt-4 space-y-4">
        <AdminHomeOpsRoleGuide />
        <AdminHomePhase2PrepNotice variant="maintainer" />
        <AdminAuditCompareLinks />
        <AdminHomeOperatorGuide />
      </div>
    </details>
  );
}
