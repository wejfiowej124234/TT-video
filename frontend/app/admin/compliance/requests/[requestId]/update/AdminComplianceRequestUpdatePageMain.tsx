"use client";

import Link from "next/link";
import { useId, type FormEvent } from "react";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminComplianceDsarWorkflowNotice } from "@/components/admin/AdminComplianceDsarWorkflowNotice";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminSuccessBanner } from "@/components/admin/AdminSuccessBanner";
import { useTranslation } from "@/components/LocaleProvider";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { DSAR_STATUSES, DSAR_STATUS_I18N } from "./adminComplianceRequestUpdatePageModel";
import { useAdminComplianceRequestUpdatePage } from "./useAdminComplianceRequestUpdatePage";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, TT_ADMIN_PAGE_INNER_FORM, adminPageNavLinkClass } from "@/lib/adminUi";

/** 500：DSAR 登记更新（super_admin + 乐观锁 + 幂等键）。 */
export function AdminComplianceRequestUpdatePageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const complianceUpdateFilterHintId = useId();
  const expectedVersionId = useId();
  const eventTypeId = useId();
  const statusId = useId();
  const notesId = useId();
  const eventDetailId = useId();
  const writeErrorId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminComplianceUpdateMetaBuild");
  const {
    requestId,
    expectedVersion,
    setExpectedVersion,
    eventType,
    setEventType,
    statusSel,
    setStatusSel,
    notes,
    setNotes,
    eventDetail,
    setEventDetail,
    exportSignature,
    setExportSignature,
    recordHashFingerprint,
    setRecordHashFingerprint,
    submitting,
    writeError,
    writeErrorKind,
    writeOk,
    submit,
    canUpdate,
    capsLoading,
  } = useAdminComplianceRequestUpdatePage();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <AdminDetailPageChrome
      innerClass={TT_ADMIN_PAGE_INNER_FORM}
      titleId={pageTitleId}
      title={t("admin_compliance_update_title")}
      subtitle={
        <>
          <span>{t("admin_compliance_update_subtitle")}</span>
          {requestId ? (
            <p className="mt-2 font-mono text-small text-ink-500 break-all">
              {t("admin_compliance_events_requestId")}
              {t("market_fin_colon")}
              {requestId}
            </p>
          ) : null}
        </>
      }
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          {requestId ? (
            <Link
              href={`/admin/compliance/requests/${encodeURIComponent(requestId)}/events`}
              className={`${adminPageNavLinkClass()}`}
            >
              {t("admin_compliance_update_backEvents")}
            </Link>
          ) : null}
          <Link href="/admin/compliance/requests" className={`${adminPageNavLinkClass()}`}>
            {t("admin_compliance_events_backList")}
          </Link>
        </>
      }
    >
      <AdminComplianceDsarWorkflowNotice />
      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      {!requestId ? (
        <AdminAlertError className="mt-6" message={t("admin_compliance_update_missingId")} />
      ) : (
        <section
          className="mt-8 space-y-4 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5"
          aria-label={t("admin_compliance_update_form_aria")}
        >
          <p id={complianceUpdateFilterHintId} className="text-meta text-ink-600">
            {t("admin_compliance_update_filter_hint")}
          </p>
          {!canUpdate && !capsLoading ? (
            <AdminNoticeBanner
              tone="readonly"
              message={t("admin_compliance_update_super_only")}
              dataAttrs={{ "data-tt-admin-compliance-update-readonly": "1" }}
            />
          ) : null}

          <form
            className="space-y-4"
            aria-describedby={writeError ? `${complianceUpdateFilterHintId} ${writeErrorId}` : complianceUpdateFilterHintId}
            onSubmit={onSubmit}
          >
            <label htmlFor={expectedVersionId} className="block text-small text-ink-800">
              {t("admin_compliance_update_expectedVersion")}
              <input
                id={expectedVersionId}
                name="expected_version"
                type="text"
                inputMode="numeric"
                value={expectedVersion}
                onChange={(e) => setExpectedVersion(e.target.value)}
                aria-invalid={!!writeError}
                aria-errormessage={writeError ? writeErrorId : undefined}
                className={`mt-1 min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </label>

            <label htmlFor={eventTypeId} className="block text-small text-ink-800">
              {t("admin_compliance_update_eventType")}
              <input
                id={eventTypeId}
                name="event_type"
                type="text"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                aria-invalid={!!writeError}
                aria-errormessage={writeError ? writeErrorId : undefined}
                className={`mt-1 min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_compliance_update_eventTypePh")}
              />
            </label>

            <label htmlFor={statusId} className="block text-small text-ink-800">
              {t("admin_compliance_update_statusOptional")}
              <select
                id={statusId}
                name="status"
                value={statusSel}
                onChange={(e) => setStatusSel(e.target.value)}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {DSAR_STATUSES.map((s) => (
                  <option key={s || "omit"} value={s}>
                    {s === "" ? t("admin_compliance_update_statusOmit") : t(DSAR_STATUS_I18N[s])}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor={notesId} className="block text-small text-ink-800">
              {t("admin_compliance_update_notesOptional")}
              <textarea
                id={notesId}
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`mt-1 min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </label>

            <label htmlFor={eventDetailId} className="block text-small text-ink-800">
              {t("admin_compliance_update_detailOptional")}
              <textarea
                id={eventDetailId}
                name="event_detail"
                value={eventDetail}
                onChange={(e) => setEventDetail(e.target.value)}
                rows={2}
                className={`mt-1 min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </label>

            <label className="block text-small text-ink-800">
              {t("admin_compliance_update_exportSignature")}
              <input
                value={exportSignature}
                onChange={(e) => setExportSignature(e.target.value)}
                className={`mt-1 min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </label>

            <label className="block text-small text-ink-800">
              {t("admin_compliance_update_recordHash")}
              <input
                value={recordHashFingerprint}
                onChange={(e) => setRecordHashFingerprint(e.target.value)}
                className={`mt-1 min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </label>

            {writeError && writeErrorKind ? (
              <AdminAlertError id={writeErrorId} message={writeError} errorKind={writeErrorKind} />
            ) : null}
            {writeOk ? <AdminSuccessBanner message={writeOk} /> : null}

            <button
              type="submit"
              disabled={submitting || !canUpdate}
              aria-busy={submitting ? true : undefined}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
            >
              {submitting ? t("admin_compliance_update_submitting") : t("admin_compliance_update_submit")}
            </button>
          </form>
        </section>
      )}
    </AdminDetailPageChrome>
  );
}
