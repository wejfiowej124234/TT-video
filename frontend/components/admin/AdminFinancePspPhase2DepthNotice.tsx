"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { FINANCE_SUITE_MODULES } from "@/app/admin/finance-suite/adminFinanceSuitePageModel";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** FIN-02 · ① 七件套 partial 深度诚实边界（真 PSP · ②/③ 另闸）。 */
export function AdminFinancePspPhase2DepthNotice() {
  const { t } = useTranslation();
  const partialCount = FINANCE_SUITE_MODULES.filter((m) => m.status === "partial").length;
  const total = FINANCE_SUITE_MODULES.length;

  return (
    <AdminNoticeBanner
      tone="warning"
      size="md"
      className="mt-6"
      dataAttrs={{ "data-tt-admin-fin-psp-phase2-notice": "1" }}
      message={
        <div className="space-y-2">
          <p className="font-medium">{t("admin_fin_psp_phase2_title")}</p>
          <p className="text-small">
            {t("admin_fin_psp_phase2_lead", { partial: partialCount, total })}
          </p>
          <p className="text-meta">{t("admin_fin_psp_phase2_honesty")}</p>
          <p>
            <Link
              href="/admin/permissions#admin-phase2-remaining-backlog"
              className={adminPageNavLinkClass()}
              data-tt-admin-fin-psp-phase2-backlog-link="1"
            >
              {t("admin_fin_psp_phase2_backlog_link")}
            </Link>
          </p>
        </div>
      }
    />
  );
}
