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
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { disputeStatusLabelKey } from "@/lib/admin/adminDisputesLabels";
import { AdminDisputeDetailTimeline } from "../AdminDisputeDetailTimeline";
import { ADMIN_DISPUTE_DETAIL_FIELD_DEFS, adminDisputeDetailFmt } from "./adminDisputeDetailPageModel";
import { useAdminDisputeDetailPage } from "./useAdminDisputeDetailPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass, adminTableInlineLinkClass } from "@/lib/adminUi";
export function AdminDisputeDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { disputeId, loading, error, dispute, meta, orderId } = useAdminDisputeDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_dispute_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-meta break-all">{disputeId || t("admin_em_dash")}</p>
          <p className="mt-1 text-small text-ink-500">{t("admin_dispute_detail_subtitle")}</p>
        </>
      }
      headerAside={
        <>
          <Link
            href="/admin/disputes"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_dispute_detail_back_list")}
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

      <section className="mt-6 space-y-4" aria-label={t("admin_dispute_detail_panel_aria")}>
        {!disputeId ? (
          <AdminAlertError message={t("admin_dispute_detail_missingId")} />
        ) : loading ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !dispute ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`}>
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
                  <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">{display}</dd>
                  </div>
                );
              })}
            </dl>
            <div className="mt-3">
              <h3 className="text-meta font-medium text-ink-600">{t("admin_dispute_detail_evidenceHashes")}</h3>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-[var(--radius-md)] bg-bg-console p-3 text-meta text-ink-700">
                {adminDisputeDetailFmt(dispute.evidence_hashes) || t("admin_em_dash")}
              </pre>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-small">
              {orderId ? (
                <Link
                  href={`/admin/orders/${encodeURIComponent(orderId)}`}
                  className={`${adminTableInlineLinkClass()}`}
                >
                  {t("admin_dispute_detail_linkOrderAdmin")}
                </Link>
              ) : null}
              <Link
                href={`/disputes/${encodeURIComponent(disputeId)}`}
                className={`${adminTableInlineLinkClass()}`}
              >
                {t("admin_disputes_opsOpen")}
              </Link>
            </div>
          </div>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
