"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { disputeStatusLabelKey } from "@/lib/admin/adminDisputesLabels";
import { AdminDisputeDetailTimeline } from "../AdminDisputeDetailTimeline";
import { AdminDisputeReadonlyAdjudicationDesk } from "@/components/admin/AdminDisputeReadonlyAdjudicationDesk";
import { AdminDisputeEvidenceAuditTrail } from "@/components/admin/AdminDisputeEvidenceAuditTrail";
import { ADMIN_DISPUTE_DETAIL_FIELD_DEFS, adminDisputeDetailFmt, DISPUTE_DETAIL_RELATED_FOLD_LINKS } from "./adminDisputeDetailPageModel";
import { useAdminDisputeDetailPage } from "./useAdminDisputeDetailPage";
import {
  ADMIN_DETAIL_FIELD_ROW_CLASS,
  adminPageNavLinkClass,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
export function AdminDisputeDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { disputeId, loading, refreshing, error, dispute, meta, orderId } = useAdminDisputeDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_dispute_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-small text-ink-800 break-all">{disputeId || t("admin_em_dash")}</p>
          <p className="mt-1 text-small text-ink-500">{t("admin_dispute_detail_subtitle_l5")}</p>
        </>
      }
      headerAside={
        <AdminFinanceSectionBackLinks>
          <Link
            href="/admin/disputes"
            className={adminPageNavLinkClass()}
            data-tt-admin-dispute-detail-back-list="1"
          >
            {t("admin_dispute_detail_back_list")}
          </Link>
        </AdminFinanceSectionBackLinks>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={DISPUTE_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_dispute_detail_related_aria"
        foldSummaryKey="admin_dispute_detail_related_fold"
        dataTtFold="dispute-detail"
      />
      <AdminDisputeReadonlyAdjudicationDesk
        disputeId={disputeId}
        orderId={orderId}
        status={typeof dispute?.status === "string" ? dispute.status : undefined}
        variant="detail"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_dispute_detail_panel_aria")}>
        {!disputeId ? (
          <AdminAlertError message={t("admin_dispute_detail_missingId")} />
        ) : loading && !dispute ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error && !dispute ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !dispute ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <AdminDetailContentPanel
            className={refreshing ? ADMIN_LIST_REFRESHING_SURFACE_CLASS : undefined}
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
            <AdminDisputeDetailTimeline
              status={typeof dispute.status === "string" ? dispute.status : undefined}
              createdAt={
                typeof dispute.created_at === "string" ? dispute.created_at : undefined
              }
            />
            <p className="mt-4 text-small font-medium text-ink-800">
              {t("admin_dispute_detail_status_current")}:{" "}
              {t(disputeStatusLabelKey(typeof dispute.status === "string" ? dispute.status : undefined))}
            </p>
            <h2 className="mt-4 text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_dispute_detail_dispute_section")}
            </h2>
            <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
              {ADMIN_DISPUTE_DETAIL_FIELD_DEFS.map(({ key, labelKey }) => {
                const raw = dispute[key];
                const display = adminDisputeDetailFmt(raw) || t("admin_em_dash");
                return (
                  <div key={key} className={`${ADMIN_DETAIL_FIELD_ROW_CLASS}`}>
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 break-all font-mono text-small text-ink-800 text-ink-800">{display}</dd>
                  </div>
                );
              })}
            </dl>
            <AdminDisputeEvidenceAuditTrail
              evidenceHashes={dispute.evidence_hashes}
              disputeId={disputeId}
            />
            <div className="mt-4 flex flex-wrap gap-3" data-tt-admin-dispute-detail-actions="1">
              {orderId ? (
                <Link
                  href={`/admin/orders/${encodeURIComponent(orderId)}`}
                  className={adminTableRowPrimaryActionClass()}
                  data-tt-admin-dispute-detail-action-primary="order"
                >
                  {t("admin_dispute_detail_linkOrderAdmin")}
                </Link>
              ) : null}
              <Link
                href={`/disputes/${encodeURIComponent(disputeId)}`}
                className={adminTableRowSecondaryActionClass()}
                data-tt-admin-dispute-detail-action-secondary="ops"
              >
                {t("admin_dispute_adjudication_open_public")}
              </Link>
            </div>
          </AdminDetailContentPanel>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
