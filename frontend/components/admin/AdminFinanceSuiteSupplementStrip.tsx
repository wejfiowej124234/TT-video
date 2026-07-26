"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { FINANCE_SUITE_SUPPLEMENT_MODULES } from "@/app/admin/finance-suite/adminFinanceSuitePageModel";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_CONSOLE_CALLOUT_LINK_CLASS, ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS, ADMIN_WARM_L5_FRAME_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const SUPPLEMENT_COUNT = FINANCE_SUITE_SUPPLEMENT_MODULES.length;

/** FIN-02 · ① 七件套旁路 partial 深度（可折叠 · 默认折叠 · 非 ② PSP 闭环）。 */
export function AdminFinanceSuiteSupplementStrip() {
  const { t } = useTranslation();

  return (
    <details
      id="admin-fin-suite-supplement-fold"
      className={`mt-6 overflow-hidden ${ADMIN_WARM_L5_FRAME_CLASS}`}
      data-tt-admin-fin-suite-supplement="1"
      data-tt-admin-fin-suite-supplement-fold="1"
      data-tt-admin-fin-suite-supplement-default-open="0"
      data-tt-admin-fin-suite-supplement-count={String(SUPPLEMENT_COUNT)}
    >
      <summary
        className={`${touchTargetLink44Classes} cursor-pointer list-none text-body font-semibold text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
        id="admin-fin-suite-supplement-heading"
      >
        {t("admin_fin_suite_supplement_fold_summary", { count: SUPPLEMENT_COUNT })}
      </summary>
      <p className="mt-3 text-small text-ink-600">
        {t("admin_fin_suite_supplement_lead", { count: SUPPLEMENT_COUNT })}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FINANCE_SUITE_SUPPLEMENT_MODULES.map((m) => (
          <li
            key={m.id}
            className={ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS}
            data-tt-admin-fin-suite-supplement-module={m.id}
          >
            <h3 className="text-small font-semibold text-slate-100">{t(m.titleKey)}</h3>
            <p className="mt-1 text-meta text-slate-400">{t(m.descKey)}</p>
            {"targetSnapshotClaim" in m && m.targetSnapshotClaim ? (
              <p
                className="mt-1 text-meta text-warning"
                data-tt-admin-fin-module-target="snapshot-claim"
              >
                {t("admin_fin_module_target_snapshot_claim")}
              </p>
            ) : null}
            <Link
              href={adminFinancePartialDepthHref(m.href, m.id)}
              className={`mt-2 inline-block text-small font-medium ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}
              data-tt-admin-fin-suite-supplement-open="partial"
            >
              {t("admin_fin_suite_hub_depth_open")}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
