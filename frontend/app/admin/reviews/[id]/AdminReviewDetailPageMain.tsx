"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { ADMIN_REVIEW_DETAIL_ROW_DEFS, REVIEW_DETAIL_RELATED_FOLD_LINKS, adminReviewDetailFmt } from "./adminReviewDetailPageModel";
import { useAdminReviewDetailPage } from "./useAdminReviewDetailPage";
import {
  ADMIN_DETAIL_FIELD_LABEL_CLASS,
  ADMIN_DETAIL_FIELD_ROW_CLASS,
  ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS,
  ADMIN_DETAIL_SECTION_TITLE_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
export function AdminReviewDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { reviewId, loading, refreshing, error, review, source, meta, orderId } = useAdminReviewDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_review_detail_title")}
      subtitle={
        <>
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS}>{reviewId || t("admin_em_dash")}</p>
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS}>{t("admin_review_detail_subtitle_l5")}</p>
        </>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={REVIEW_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_review_detail_related_aria"
        foldSummaryKey="admin_review_detail_related_fold"
        dataTtFold="review-detail"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_review_detail_panel_aria")}>
        {!reviewId ? (
          <AdminAlertError message={t("admin_review_detail_missingId")} />
        ) : loading && !review ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error && !review ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !review ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <AdminDetailContentPanel
            className={refreshing ? ADMIN_LIST_REFRESHING_SURFACE_CLASS : undefined}
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
              <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>
                {t("admin_review_detail_review_section")}
              </h2>
              <p className="mt-2 text-meta text-ink-600">
                {t("admin_review_detail_metaSource")}:{" "}
                <span className="font-mono text-ink-800">{source || t("admin_em_dash")}</span>
              </p>
              <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
                <div className={`${ADMIN_DETAIL_FIELD_ROW_CLASS}`}>
                  <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t("admin_review_detail_reviewId")}</dt>
                  <dd className={ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS}>
                    {adminReviewDetailFmt(review.id) || t("admin_em_dash")}
                  </dd>
                </div>
                {ADMIN_REVIEW_DETAIL_ROW_DEFS.map(({ key, labelKey }) => {
                  const raw = review[key];
                  const display = adminReviewDetailFmt(raw) || t("admin_em_dash");
                  return (
                    <div key={key} className={`${ADMIN_DETAIL_FIELD_ROW_CLASS}`}>
                      <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t(labelKey)}</dt>
                      <dd className={ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS}>{display}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 flex flex-wrap gap-3" data-tt-admin-review-detail-actions="1">
                {orderId ? (
                  <Link
                    href={`/admin/orders/${encodeURIComponent(orderId)}`}
                    className={adminTableRowPrimaryActionClass()}
                    data-tt-admin-review-detail-action-primary="order"
                  >
                    {t("admin_review_detail_linkOrderAdmin")}
                  </Link>
                ) : null}
                {orderId ? (
                  <Link
                    href={`/escrow/${encodeURIComponent(orderId)}`}
                    onClick={() => stashEscrowOrderPrefetchForOrderIdNav(orderId, "escrow")}
                    className={adminTableRowSecondaryActionClass()}
                    data-tt-admin-review-detail-action-secondary="escrow"
                  >
                    {t("admin_ops_orderEscrow")}
                  </Link>
                ) : null}
              </div>
            </AdminDetailContentPanel>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
