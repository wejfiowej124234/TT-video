"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import {
  ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS,
  ADMIN_DETAIL_FIELD_LABEL_CLASS,
  ADMIN_DETAIL_FIELD_ROW_SIMPLE_CLASS,
  ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS,
  ADMIN_DETAIL_SECTION_TITLE_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";

import { approvalStatusLabelKey } from "../adminApprovalWorkflowModel";
import { APPROVAL_DETAIL_ADVANCED_ROW_DEFS, APPROVAL_DETAIL_BASIC_ROW_DEFS, APPROVAL_DETAIL_RELATED_FOLD_LINKS, fmtApprovalDetailValue } from "./adminApprovalDetailPageModel";
import { AdminApprovalDetailTimeline } from "./AdminApprovalDetailTimeline";
import { AdminApprovalDetailWorkflowPanel } from "./AdminApprovalDetailWorkflowPanel";
import { useAdminApprovalDetailPage } from "./useAdminApprovalDetailPage";

export function AdminApprovalDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const vm = useAdminApprovalDetailPage();
  const { approvalId, loading, refreshing, error, row, meta, timeline, isPending } = vm;
  const statusKey = approvalStatusLabelKey(typeof row?.status === "string" ? row.status : undefined);

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_approval_detail_title")}
      subtitle={
        <>
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS}>{approvalId || t("admin_em_dash")}</p>
          {row ? (
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-meta font-medium ${
                isPending ? ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS : ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS
              }`}
            >
              {t(statusKey)}
            </span>
          ) : null}
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS}>{t("admin_approval_detail_subtitle_l5")}</p>
        </>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={APPROVAL_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_approval_detail_related_aria"
        foldSummaryKey="admin_approval_detail_related_fold"
        dataTtFold="approval"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 grid gap-6 lg:grid-cols-2" aria-label={t("admin_approval_detail_panel_aria")}>
        <div className="space-y-4">
          {!approvalId ? (
            <AdminAlertError message={t("admin_approval_detail_missingId")} />
          ) : loading && !row ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error && !row ? (
            <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
          ) : !row ? (
            <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
          ) : (
            <div
              className={`space-y-4${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
              data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
            >
              <AdminDetailContentPanel>
                <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>
                  {t("admin_approval_timeline_aria")}
                </h2>
                <AdminApprovalDetailTimeline steps={timeline} />
              </AdminDetailContentPanel>
              <AdminDetailContentPanel>
                <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>
                  {t("admin_approval_detail_summary_title")}
                </h2>
                <dl className="mt-3 grid gap-2 text-body">
                  {APPROVAL_DETAIL_BASIC_ROW_DEFS.map(({ key, labelKey }) => {
                    const raw = row[key];
                    let display: string;
                    if (key === "created_at" || key === "approved_at") {
                      display =
                        typeof raw === "string" && raw.trim()
                          ? new Date(raw).toLocaleString()
                          : fmtApprovalDetailValue(raw) || t("admin_em_dash");
                    } else {
                      display = fmtApprovalDetailValue(raw) || t("admin_em_dash");
                    }
                    return (
                      <div key={key} className={`${ADMIN_DETAIL_FIELD_ROW_SIMPLE_CLASS}`}>
                        <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t(labelKey)}</dt>
                        <dd className={`${ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS} whitespace-pre-wrap`}>
                          {display}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </AdminDetailContentPanel>
              <AdminDetailContentPanel as="details">
                <summary className="cursor-pointer text-small font-medium text-ink-800">
                  {t("admin_approval_detail_advanced_fold")}
                </summary>
                <dl className="mt-3 grid gap-2 text-body">
                  {APPROVAL_DETAIL_ADVANCED_ROW_DEFS.map(({ key, labelKey }) => {
                    const raw = row[key];
                    const display = fmtApprovalDetailValue(raw) || t("admin_em_dash");
                    return (
                      <div key={key} className={`${ADMIN_DETAIL_FIELD_ROW_SIMPLE_CLASS}`}>
                        <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t(labelKey)}</dt>
                        <dd className={`${ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS} whitespace-pre-wrap break-all text-meta`}>
                          {display}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </AdminDetailContentPanel>
            </div>
          )}
        </div>
        <div>
          <AdminApprovalDetailWorkflowPanel vm={vm} />
        </div>
      </section>
    </AdminDetailPageChrome>
  );
}
