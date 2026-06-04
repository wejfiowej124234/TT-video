"use client";

import type { FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
import {
  COMPLIANCE_REQUESTS_JURIS_MAX,
  COMPLIANCE_REQUESTS_REF_MAX,
  COMPLIANCE_REQUESTS_SUBJECT_MAX,
} from "./adminComplianceRequestsPageModel";

type AdminComplianceRequestsFiltersBlockProps = {
  limitInputId: string;
  refInputId: string;
  subjectInputId: string;
  typeInputId: string;
  statusInputId: string;
  jurisInputId: string;
  adminListApplyResetHintId: string;
  adminFilterHintId: string;
  adminAppliedFiltersDescId: string;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftRequestRef: string;
  setDraftRequestRef: (v: string) => void;
  draftSubjectId: string;
  setDraftSubjectId: (v: string) => void;
  draftRequestType: string;
  setDraftRequestType: (v: string) => void;
  draftStatus: string;
  setDraftStatus: (v: string) => void;
  draftJurisdiction: string;
  setDraftJurisdiction: (v: string) => void;
  apply: (e?: FormEvent) => void;
  clearNonLimitFilters: () => void;
  hasActiveFilters: boolean;
};

export function AdminComplianceRequestsFiltersBlock({
  limitInputId,
  refInputId,
  subjectInputId,
  typeInputId,
  statusInputId,
  jurisInputId,
  adminListApplyResetHintId,
  adminFilterHintId,
  adminAppliedFiltersDescId,
  appliedFilters,
  draftLimit,
  setDraftLimit,
  draftRequestRef,
  setDraftRequestRef,
  draftSubjectId,
  setDraftSubjectId,
  draftRequestType,
  setDraftRequestType,
  draftStatus,
  setDraftStatus,
  draftJurisdiction,
  setDraftJurisdiction,
  apply,
  clearNonLimitFilters,
  hasActiveFilters,
}: AdminComplianceRequestsFiltersBlockProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-compliance-requests-filter-form"
          className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
          aria-label={t("admin_compliance_requests_filters")}
          aria-describedby={
            [adminListApplyResetHintId, adminFilterHintId, appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="w-full text-meta text-ink-600 leading-relaxed lg:basis-full">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="min-w-[8rem]">
            <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
              {t("admin_compliance_requests_limit")}
            </label>
            <input
              id={limitInputId}
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`mt-1 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </div>
          <div className="min-w-[9rem] flex-1">
            <label htmlFor={refInputId} className="block text-small font-medium text-ink-600">
              {t("admin_compliance_requests_filter_request_ref")}
            </label>
            <input
              id={refInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={COMPLIANCE_REQUESTS_REF_MAX}
              value={draftRequestRef}
              onChange={(e) => setDraftRequestRef(e.target.value.slice(0, COMPLIANCE_REQUESTS_REF_MAX))}
              placeholder={t("admin_compliance_requests_filter_request_ref_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label htmlFor={subjectInputId} className="block text-small font-medium text-ink-600">
              {t("admin_compliance_requests_filter_subject_id")}
            </label>
            <input
              id={subjectInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={COMPLIANCE_REQUESTS_SUBJECT_MAX}
              value={draftSubjectId}
              onChange={(e) => setDraftSubjectId(e.target.value.slice(0, COMPLIANCE_REQUESTS_SUBJECT_MAX))}
              placeholder={t("admin_compliance_requests_filter_subject_id_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[8rem]">
            <label htmlFor={typeInputId} className="block text-small font-medium text-ink-600">
              {t("admin_compliance_requests_filter_request_type")}
            </label>
            <select
              id={typeInputId}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftRequestType}
              onChange={(e) => setDraftRequestType(e.target.value)}
            >
              <option value="">{t("admin_compliance_requests_filter_any")}</option>
              <option value="export">export</option>
              <option value="erasure">erasure</option>
            </select>
          </div>
          <div className="min-w-[10rem]">
            <label htmlFor={statusInputId} className="block text-small font-medium text-ink-600">
              {t("admin_compliance_requests_filter_status")}
            </label>
            <select
              id={statusInputId}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="">{t("admin_compliance_requests_filter_any")}</option>
              <option value="open">open</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="rejected">rejected</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <div className="min-w-[8rem] flex-1">
            <label htmlFor={jurisInputId} className="block text-small font-medium text-ink-600">
              {t("admin_compliance_requests_filter_jurisdiction")}
            </label>
            <input
              id={jurisInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={COMPLIANCE_REQUESTS_JURIS_MAX}
              value={draftJurisdiction}
              onChange={(e) => setDraftJurisdiction(e.target.value.slice(0, COMPLIANCE_REQUESTS_JURIS_MAX))}
              placeholder={t("admin_compliance_requests_filter_jurisdiction_placeholder")}
              autoComplete="off"
            />
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-compliance-requests-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          >
            {t("admin_compliance_requests_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                clearNonLimitFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {t("admin_compliance_requests_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_compliance_requests_filter_hint")}
      </p>
    </>
  );
}
