"use client";

import { type FormEvent } from "react";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
import {
  RC_MAX,
  STATUS_OPTIONS,
  TT_MAX,
} from "./adminCommunityReportsTypes";

export type AdminCommunityReportsFilterIds = {
  adminListApplyResetHintId: string;
  adminAppliedFiltersDescId: string;
  communityReportsFilterLimitId: string;
  communityReportsFilterStatusId: string;
  communityReportsFilterReporterId: string;
  communityReportsFilterTargetTypeId: string;
  communityReportsFilterReasonCodeId: string;
  communityReportsFilterTargetId: string;
};

export function AdminCommunityReportsFilterCard({
  t,
  ids,
  loading,
  error,
  appliedFilters,
  draftLimit,
  setDraftLimit,
  draftStatus,
  setDraftStatus,
  draftReporterId,
  setDraftReporterId,
  draftTargetType,
  setDraftTargetType,
  draftReasonCode,
  setDraftReasonCode,
  draftTargetId,
  setDraftTargetId,
  apply,
  hasExtraFilters,
  resetExtraFilters,
}: {
  t: (k: string) => string;
  ids: AdminCommunityReportsFilterIds;
  loading: boolean;
  error: AdminFetchErrorKind | null;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftStatus: string;
  setDraftStatus: (v: string) => void;
  draftReporterId: string;
  setDraftReporterId: (v: string) => void;
  draftTargetType: string;
  setDraftTargetType: (v: string) => void;
  draftReasonCode: string;
  setDraftReasonCode: (v: string) => void;
  draftTargetId: string;
  setDraftTargetId: (v: string) => void;
  apply: (e?: FormEvent) => void;
  hasExtraFilters: boolean;
  resetExtraFilters: () => void;
}) {
  const { adminListApplyResetHintId, adminAppliedFiltersDescId, ...inputIds } = ids;
  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
      <form
        id="admin-community-reports-filter-form"
        aria-label={t("admin_community_reports_filters")}
        aria-describedby={
          [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
        className="flex flex-col gap-3"
      >
        <p className="text-small font-medium text-ink-800">{t("admin_community_reports_filters")}</p>
        <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label htmlFor={inputIds.communityReportsFilterLimitId} className="text-small text-ink-700">
            {t("admin_community_reports_limit")}
            <input
              id={inputIds.communityReportsFilterLimitId}
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <label htmlFor={inputIds.communityReportsFilterStatusId} className="text-small text-ink-700">
            {t("admin_community_reports_status")}
            <select
              id={inputIds.communityReportsFilterStatusId}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
              className={`ml-2 inline-flex min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {STATUS_OPTIONS.map((v) => (
                <option key={v || "all"} value={v}>
                  {v === "" ? t("admin_community_reports_statusAll") : v}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={inputIds.communityReportsFilterReporterId} className="text-small text-ink-700 block min-w-[12rem]">
            {t("admin_community_reports_reporter_id")}
            <input
              id={inputIds.communityReportsFilterReporterId}
              type="text"
              value={draftReporterId}
              onChange={(e) => setDraftReporterId(e.target.value)}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_community_reports_reporter_id_ph")}
              autoComplete="off"
            />
          </label>
          <label htmlFor={inputIds.communityReportsFilterTargetTypeId} className="text-small text-ink-700 block min-w-[8rem]">
            {t("admin_community_reports_target_type")}
            <input
              id={inputIds.communityReportsFilterTargetTypeId}
              type="text"
              value={draftTargetType}
              onChange={(e) => setDraftTargetType(e.target.value.slice(0, TT_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_community_reports_target_type_ph")}
              autoComplete="off"
            />
          </label>
          <label htmlFor={inputIds.communityReportsFilterReasonCodeId} className="text-small text-ink-700 block min-w-[10rem]">
            {t("admin_community_reports_reason_code")}
            <input
              id={inputIds.communityReportsFilterReasonCodeId}
              type="text"
              value={draftReasonCode}
              onChange={(e) => setDraftReasonCode(e.target.value.slice(0, RC_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_community_reports_reason_code_ph")}
              autoComplete="off"
            />
          </label>
          <label htmlFor={inputIds.communityReportsFilterTargetId} className="text-small text-ink-700 block min-w-[12rem]">
            {t("admin_community_reports_target_id")}
            <input
              id={inputIds.communityReportsFilterTargetId}
              type="text"
              value={draftTargetId}
              onChange={(e) => setDraftTargetId(e.target.value)}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_community_reports_target_id_ph")}
              autoComplete="off"
            />
          </label>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          form="admin-community-reports-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
        >
          {t("admin_community_reports_apply")}
        </button>
        {hasExtraFilters ? (
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              resetExtraFilters();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_community_reports_clear_extra")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
