"use client";

import Link from "next/link";

import { useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { disputeStatusLabelKey } from "@/lib/admin/adminDisputesLabels";
import { shortAdminId } from "@/lib/admin/shortAdminId";
import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { resolveRefundProgressBuckets } from "@/lib/admin/adminFinanceRefundProgress";
import {
  adminPageNavLinkClass,
  ADMIN_CONSOLE_CALLOUT_LINK_CLASS,
  ADMIN_LIST_ROW_MUTED_CLASS,
  ADMIN_TEXT_META_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type DisputeRow = { id: string; status: string; order_id?: string };

type Props = {
  items: DisputeRow[];
  loading: boolean;
  error: boolean;
};

export function AdminFinanceRefundsDepthPanel({ items, loading, error }: Props) {
  const { t } = useTranslation();
  const openCount = useMemo(
    () => items.filter((d) => (d.status ?? "").toLowerCase() === "open").length,
    [items],
  );
  const preview = items.slice(0, 5);
  const progressBuckets = useMemo(
    () => resolveRefundProgressBuckets(null, openCount),
    [openCount],
  );

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"
      aria-label={t("admin_fin_refunds_depth_aria")}
      data-tt-admin-fin-refunds-depth="1"
      data-tt-admin-fin-not-refund-center="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_refunds_depth_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_refunds_depth_lead")}</p>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_fin_refund_progress_lead")}</p>

      <ul
        className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-tt-admin-fin-refund-progress="1"
      >
        {progressBuckets.map((b) => (
          <li key={b.id} data-tt-admin-fin-refund-bucket={b.id}>
            <p className="text-meta text-ink-600">{t(b.labelKey)}</p>
            <p className="tabular-nums font-medium text-ink-900">
              {b.id === "open_dispute" ? b.count : "—"}
            </p>
            <Link
              href={b.href}
              className={`text-meta ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}
            >
              {t("admin_fin_refund_bucket_open")}
            </Link>
          </li>
        ))}
      </ul>

      {loading ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>
      ) : error ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_fin_refunds_depth_load_failed")}</p>
      ) : (
        <>
          <p className="mt-3 text-small font-medium text-ink-800" data-tt-admin-fin-refunds-open-count="1">
            {t("admin_fin_refunds_depth_open_count", { count: openCount, total: items.length })}
          </p>
          {preview.length > 0 ? (
            <ul className="mt-3 space-y-2" data-tt-admin-fin-refunds-preview-list="1">
              {preview.map((d) => (
                <li key={d.id} className={ADMIN_LIST_ROW_MUTED_CLASS}>
                  <span className="font-mono text-meta">{shortAdminId(d.id)}</span>
                  <span>{t(disputeStatusLabelKey(d.status))}</span>
                  <Link
                    href={`/admin/disputes/${encodeURIComponent(d.id)}`}
                    className={`${adminPageNavLinkClass()}`}
                  >
                    {t("admin_fin_refunds_depth_open_row")}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-small text-ink-500">{t("admin_fin_refunds_depth_empty")}</p>
          )}
        </>
      )}
      <AdminFinanceDepthActionLinks
        links={[
          { href: "/admin/disputes", labelKey: "admin_fin_refunds_depth_all_disputes" },
          {
            href: adminFinancePartialDepthHref("/admin/finance", "finance-summary"),
            labelKey: "admin_fin_refund_progress_title",
          },
          { href: "/admin/finance-suite", labelKey: "admin_fin_drift_depth_link_suite" },
        ]}
      />
    </AdminWarmL5Surface>
  );
}
