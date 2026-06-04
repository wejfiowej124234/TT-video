"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF } from "@/lib/admin/adminInboxQueueHrefs";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

import { approvalStatusLabelKey } from "../adminApprovalWorkflowModel";
import { APPROVAL_DETAIL_ROW_DEFS, fmtApprovalDetailValue } from "./adminApprovalDetailPageModel";
import { AdminApprovalDetailTimeline } from "./AdminApprovalDetailTimeline";
import { AdminApprovalDetailWorkflowPanel } from "./AdminApprovalDetailWorkflowPanel";
import { useAdminApprovalDetailPage } from "./useAdminApprovalDetailPage";

export function AdminApprovalDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const vm = useAdminApprovalDetailPage();
  const { approvalId, loading, error, row, meta, timeline, isPending } = vm;
  const statusKey = approvalStatusLabelKey(typeof row?.status === "string" ? row.status : undefined);

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_approval_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-meta break-all">{approvalId || t("admin_em_dash")}</p>
          {row ? (
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-meta font-medium ${
                isPending ? ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS : ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS
              }`}
            >
              {t(statusKey)}
            </span>
          ) : null}
          <p className="mt-1 text-small text-ink-500">{t("admin_approval_detail_subtitle_l5")}</p>
        </>
      }
      headerAside={
        <>
          <Link
            href={ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF}
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_approval_detail_back_list")}
          </Link>
          <Link href="/admin/users" className={`${adminPageNavLinkClass()}`}>
            {t("admin_approvals_linkUsers")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 grid gap-6 lg:grid-cols-2" aria-label={t("admin_approval_detail_panel_aria")}>
        <div className="space-y-4">
          {!approvalId ? (
            <AdminAlertError message={t("admin_approval_detail_missingId")} />
          ) : loading ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error ? (
            <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
          ) : !row ? (
            <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
          ) : (
            <>
              <div className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`}>
                <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
                  {t("admin_approval_timeline_aria")}
                </h2>
                <AdminApprovalDetailTimeline steps={timeline} />
              </div>
              <details className={`${ADMIN_FILTER_CARD_CLASS}`}>
                <summary className="cursor-pointer text-small font-medium text-ink-800">
                  {t("admin_approval_detail_section")}
                </summary>
                <dl className="mt-3 grid gap-2 text-body">
                  {APPROVAL_DETAIL_ROW_DEFS.map(({ key, labelKey }) => {
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
                      <div key={key} className="border-b border-ink-100 pb-2 last:border-0">
                        <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                        <dd className="mt-0.5 whitespace-pre-wrap break-all font-mono text-meta text-ink-800">
                          {display}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </details>
            </>
          )}
        </div>
        <div>
          <AdminApprovalDetailWorkflowPanel vm={vm} />
        </div>
      </section>
    </AdminDetailPageChrome>
  );
}
