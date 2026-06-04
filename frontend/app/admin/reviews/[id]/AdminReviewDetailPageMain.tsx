"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_REVIEW_DETAIL_ROW_DEFS, adminReviewDetailFmt } from "./adminReviewDetailPageModel";
import { useAdminReviewDetailPage } from "./useAdminReviewDetailPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass, adminTableInlineLinkClass } from "@/lib/adminUi";
export function AdminReviewDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { reviewId, loading, error, review, source, meta, orderId } = useAdminReviewDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_review_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-meta break-all">{reviewId || t("admin_em_dash")}</p>
          <p className="mt-1 text-small text-ink-500">{t("admin_review_detail_subtitle")}</p>
        </>
      }
      headerAside={
        <>
          <Link
            href="/admin/reviews"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_review_detail_back_list")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_review_detail_panel_aria")}>
        {!reviewId ? (
          <AdminAlertError message={t("admin_review_detail_missingId")} />
        ) : loading ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !review ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <>
            <div className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`}>
              <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_review_detail_review_section")}
              </h2>
              <p className="mt-2 text-meta text-ink-600">
                {t("admin_review_detail_metaSource")}:{" "}
                <span className="font-mono text-ink-800">{source || t("admin_em_dash")}</span>
              </p>
              <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
                <div className="border-b border-ink-100 pb-2 sm:border-0 sm:pb-0">
                  <dt className="text-meta text-ink-500">{t("admin_review_detail_reviewId")}</dt>
                  <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">
                    {adminReviewDetailFmt(review.id) || t("admin_em_dash")}
                  </dd>
                </div>
                {ADMIN_REVIEW_DETAIL_ROW_DEFS.map(({ key, labelKey }) => {
                  const raw = review[key];
                  const display = adminReviewDetailFmt(raw) || t("admin_em_dash");
                  return (
                    <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                      <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                      <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">{display}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 flex flex-wrap gap-3 text-small">
                {orderId ? (
                  <Link
                    href={`/admin/orders/${encodeURIComponent(orderId)}`}
                    className={`${adminTableInlineLinkClass()}`}
                  >
                    {t("admin_review_detail_linkOrderAdmin")}
                  </Link>
                ) : null}
                {orderId ? (
                  <Link
                    href={`/escrow/${encodeURIComponent(orderId)}`}
                    onClick={() => stashEscrowOrderPrefetchForOrderIdNav(orderId, "escrow")}
                    className={`${adminTableInlineLinkClass()}`}
                  >
                    {t("admin_ops_orderEscrow")}
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
