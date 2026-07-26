"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { resolveEscrowFundSummaryBuckets } from "@/lib/admin/adminFinanceEscrowFundSummary";
import type { FinanceSummary } from "@/app/admin/finance/adminFinancePageTypes";
import { ADMIN_CONSOLE_CALLOUT_LINK_CLASS, ADMIN_TEXT_META_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type Props = {
  summary: FinanceSummary | null | undefined;
};

/** Batch-11 HU-399 · Escrow 资金只读汇总台（禁写状态机） */
export function AdminFinanceEscrowFundSummaryStrip({ summary }: Props) {
  const { t } = useTranslation();
  const buckets = resolveEscrowFundSummaryBuckets(summary);

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-escrow-summary="1"
      data-tt-admin-fin-escrow-readonly="1"
      aria-label={t("admin_fin_escrow_summary_title")}
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_escrow_summary_title")}</h2>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_fin_escrow_summary_lead")}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {buckets.map((b) => (
          <li
            key={b.id}
            className="rounded-[var(--radius-md)] border border-ink-200/40 bg-bg-console/30 px-3 py-2"
            data-tt-admin-fin-escrow-bucket={b.id}
          >
            <p className="text-small text-ink-600">{t(b.labelKey)}</p>
            <p className="mt-1 text-h4 font-semibold tabular-nums text-ink-900">{b.count}</p>
            <Link
              href={b.href}
              className={`mt-2 inline-block text-meta font-medium ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}
              data-tt-admin-fin-escrow-bucket-link={b.id}
            >
              {t("admin_fin_escrow_bucket_open")}
            </Link>
          </li>
        ))}
      </ul>
    </AdminWarmL5Surface>
  );
}
