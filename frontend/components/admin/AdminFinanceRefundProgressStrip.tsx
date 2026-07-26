"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { resolveRefundProgressBuckets } from "@/lib/admin/adminFinanceRefundProgress";
import type { FinanceSummary } from "@/app/admin/finance/adminFinancePageTypes";
import { ADMIN_CONSOLE_CALLOUT_LINK_CLASS, ADMIN_TEXT_META_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type Props = {
  summary: FinanceSummary | null | undefined;
};

/** Batch-11 HU-400 · 退款进度只读看板（非执行台） */
export function AdminFinanceRefundProgressStrip({ summary }: Props) {
  const { t } = useTranslation();
  const buckets = resolveRefundProgressBuckets(summary);

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-refund-progress="1"
      data-tt-admin-fin-not-refund-center="1"
      aria-label={t("admin_fin_refund_progress_title")}
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_refund_progress_title")}</h2>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_fin_refund_progress_lead")}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {buckets.map((b) => (
          <li
            key={b.id}
            className="rounded-[var(--radius-md)] border border-ink-200/40 bg-bg-console/30 px-3 py-2"
            data-tt-admin-fin-refund-bucket={b.id}
          >
            <p className="text-small text-ink-600">{t(b.labelKey)}</p>
            <p className="mt-1 text-h4 font-semibold tabular-nums text-ink-900">{b.count}</p>
            <Link
              href={b.href}
              className={`mt-2 inline-block text-meta font-medium ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}
              data-tt-admin-fin-refund-bucket-link={b.id}
            >
              {t("admin_fin_refund_bucket_open")}
            </Link>
          </li>
        ))}
      </ul>
    </AdminWarmL5Surface>
  );
}
