"use client";

import type { StewardAdmissionQuoteDisplay } from "@/lib/steward/stewardAdmissionQuoteDisplayModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type StewardWorkbenchAdmissionQuotePanelProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  display: StewardAdmissionQuoteDisplay;
};

/** A 轨 · USDC 准入费 · 客户向价目摘要（L5） */
export default function StewardWorkbenchAdmissionQuotePanel({
  t,
  display,
}: StewardWorkbenchAdmissionQuotePanelProps) {
  return (
    <div
      className="mt-3 rounded-xl border border-ref-sun/22 bg-gradient-to-br from-ref-sun/[0.06] via-[#0c0a09]/30 to-transparent p-4"
      data-tt-steward-admission-quote-panel="1"
    >
      <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
        <div>
          <p className={TT_WORKSPACE_L5.statLabel}>{t("steward_workbench_admission_quote_amount_due")}</p>
          <p className="mt-1 text-h3 font-bold font-mono tabular-nums text-ref-sun sm:text-[1.75rem]">
            {display.amountDueLabel}
          </p>
          {display.showListPriceCompare ? (
            <p className="mt-2 text-meta leading-relaxed text-slate-400">
              {t("steward_workbench_admission_quote_list_price_line", {
                jurisdiction: display.primaryJurisdiction,
                tier: display.tier,
                listPrice: display.listPriceLabel,
              })}
            </p>
          ) : null}
          {display.isLocalDevZero ? (
            <p className="mt-1 text-meta text-slate-500">{t("steward_workbench_admission_quote_local_dev_note")}</p>
          ) : null}
        </div>
        <dl className="space-y-3 text-meta">
          <div>
            <dt className="text-slate-500">{t("steward_workbench_admission_quote_jurisdiction")}</dt>
            <dd className="mt-0.5 font-medium text-slate-200">
              {t("steward_workbench_admission_quote_jurisdiction_value", {
                jurisdiction: display.primaryJurisdiction,
                tier: display.tier,
              })}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("steward_workbench_admission_quote_fee_schedule")}</dt>
            <dd className="mt-0.5 font-medium text-slate-200">
              {t("steward_workbench_admission_quote_fee_schedule_value", {
                version: display.feeScheduleVersion,
              })}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("steward_workbench_admission_quote_revenue_type")}</dt>
            <dd className="mt-0.5 text-slate-300">{t("steward_workbench_admission_quote_revenue_type_value")}</dd>
          </div>
        </dl>
      </div>
      <details className="mt-3 rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2">
        <summary className="cursor-pointer text-meta text-slate-500">
          {t("steward_workbench_admission_quote_technical_toggle")}
        </summary>
        <p className="mt-2 break-all font-mono text-meta leading-snug text-slate-500">
          SKU: {display.sku}
        </p>
      </details>
    </div>
  );
}
