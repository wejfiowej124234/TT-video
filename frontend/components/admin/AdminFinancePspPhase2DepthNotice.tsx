"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { FINANCE_SUITE_MODULES } from "@/app/admin/finance-suite/adminFinanceSuitePageModel";
import { ADMIN_FIN_PHASE_HONESTY_FOLD_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** FIN-02 · ① 七件套 partial 深度诚实边界（真 PSP · ②/③ 另闸 · 默认折叠）。 */
export function AdminFinancePspPhase2DepthNotice() {
  const { t } = useTranslation();
  const primaryModules = FINANCE_SUITE_MODULES.filter((m) => m.status !== "placeholder");
  const partialCount = primaryModules.filter((m) => m.status === "partial").length;
  const total = primaryModules.length;

  return (
    <details
      className={ADMIN_FIN_PHASE_HONESTY_FOLD_CLASS}
      data-tt-admin-fin-phase-honesty-fold="1"
      data-tt-admin-fin-psp-phase2-notice="1"
    >
      <summary
        className={`${touchTargetLink44Classes} cursor-pointer list-none text-small font-semibold text-slate-100 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
      >
        {t("admin_fin_phase_honesty_fold_summary")}
      </summary>
      <div className="mt-3 space-y-2 text-small text-slate-300">
        <p>{t("admin_fin_suite_phase2_note")}</p>
        <p className="font-medium text-slate-100">{t("admin_fin_psp_phase2_title")}</p>
        <p>{t("admin_fin_psp_phase2_lead", { partial: partialCount, total })}</p>
        <p className="text-meta text-slate-400">{t("admin_fin_psp_phase2_honesty")}</p>
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
    </details>
  );
}
