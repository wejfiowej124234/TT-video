"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  resolveFinanceSummaryDataSourceStrip,
  type FinanceDataSourceTone,
} from "@/lib/admin/financeOpsL5";
import type { FinanceMeta, FinanceSummary } from "@/app/admin/finance/adminFinancePageTypes";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_TEXT_META_CLASS } from "@/lib/adminUi";

type Props = {
  meta: FinanceMeta | null | undefined;
  summary: FinanceSummary | null | undefined;
};

function toneClass(tone: FinanceDataSourceTone): string {
  if (tone === "unavailable") return "border-warning/50 bg-warning/5 text-warning";
  if (tone === "mixed") return "border-ref-sun/40 bg-bg-console/50 text-slate-200";
  return "border-white/12 bg-bg-console/40 text-slate-300";
}

/** Batch-11 HU-402 · finance summary 强制数据源条（fail-closed） */
export function AdminFinanceSummaryDataSourceStrip({ meta, summary }: Props) {
  const { t } = useTranslation();
  const strip = resolveFinanceSummaryDataSourceStrip(meta, summary);

  return (
    <aside
      className={`mb-4 rounded-[var(--radius-md)] border px-4 py-3 ${ADMIN_FILTER_CARD_CLASS} ${toneClass(strip.tone)}`}
      role="note"
      data-tt-admin-finance-summary-data-source="1"
      data-tt-admin-finance-summary-data-source-tone={strip.tone}
    >
      <p className="text-body font-medium">{t("admin_finance_summary_data_source_title")}</p>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t(strip.labelKey)}</p>
      {meta?.source ? (
        <p
          className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}
          data-tt-admin-finance-meta-source={meta.source}
        >
          {t("admin_ops_leaf_data_source_connected")}
        </p>
      ) : null}
    </aside>
  );
}
