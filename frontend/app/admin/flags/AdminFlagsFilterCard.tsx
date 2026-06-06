"use client";

import type { FormEvent } from "react";
import { ADMIN_FLAG_CODE_MAX_LEN } from "./adminFlagsPageConstants";
import type { AdminFlagsPageViewModel } from "./useAdminFlagsPage";
import {ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS} from "@/lib/adminUi";
type Props = Pick<
  AdminFlagsPageViewModel,
  | "t"
  | "apply"
  | "resetFilters"
  | "hasActiveFilters"
  | "limitInputId"
  | "flagCodeInputId"
  | "enabledSelectId"
  | "scopeInputId"
  | "adminListApplyResetHintId"
  | "adminFilterHintId"
  | "flagsActiveCodeDescId"
  | "flagsActiveEnabledDescId"
  | "flagsActiveScopeDescId"
  | "adminAppliedFiltersDescId"
  | "draftLimit"
  | "setDraftLimit"
  | "draftFlagCode"
  | "setDraftFlagCode"
  | "draftEnabled"
  | "setDraftEnabled"
  | "draftScope"
  | "setDraftScope"
  | "flagCode"
  | "enabled"
  | "scope"
  | "loading"
  | "error"
  | "appliedFilters"
>;

export function AdminFlagsFilterCard({
  t,
  apply,
  resetFilters,
  hasActiveFilters,
  limitInputId,
  flagCodeInputId,
  enabledSelectId,
  scopeInputId,
  adminListApplyResetHintId,
  adminFilterHintId,
  flagsActiveCodeDescId,
  flagsActiveEnabledDescId,
  flagsActiveScopeDescId,
  adminAppliedFiltersDescId,
  draftLimit,
  setDraftLimit,
  draftFlagCode,
  setDraftFlagCode,
  draftEnabled,
  setDraftEnabled,
  draftScope,
  setDraftScope,
  flagCode,
  enabled,
  scope,
  loading,
  error,
  appliedFilters,
}: Props) {
  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
      <form
        id="admin-flags-filter-form"
        className="space-y-3"
        aria-label={t("admin_flags_filters")}
        aria-describedby={
          [
            adminListApplyResetHintId,
            adminFilterHintId,
            flagCode ? flagsActiveCodeDescId : "",
            enabled === "true" || enabled === "false" ? flagsActiveEnabledDescId : "",
            scope ? flagsActiveScopeDescId : "",
            !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
      >
        <p className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_flags_filters")}</p>
        <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[8rem]">
            <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
              {t("admin_flags_limit")}
            </label>
            <input
              id={limitInputId}
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`mt-1 min-h-[44px] w-20 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label htmlFor={flagCodeInputId} className="block text-small font-medium text-ink-600">
              {t("admin_flags_filter_flag_code")}
            </label>
            <input
              id={flagCodeInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={ADMIN_FLAG_CODE_MAX_LEN}
              value={draftFlagCode}
              onChange={(e) => setDraftFlagCode(e.target.value.slice(0, ADMIN_FLAG_CODE_MAX_LEN))}
              placeholder={t("admin_flags_filter_flag_code_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[10rem]">
            <label htmlFor={enabledSelectId} className="block text-small font-medium text-ink-600">
              {t("admin_flags_filter_enabled")}
            </label>
            <select
              id={enabledSelectId}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftEnabled}
              onChange={(e) => setDraftEnabled(e.target.value)}
            >
              <option value="">{t("admin_flags_enabled_any")}</option>
              <option value="true">{t("admin_flags_enabled_true")}</option>
              <option value="false">{t("admin_flags_enabled_false")}</option>
            </select>
          </div>
          <div className="min-w-[8rem] flex-1">
            <label htmlFor={scopeInputId} className="block text-small font-medium text-ink-600">
              {t("admin_flags_filter_scope")}
            </label>
            <input
              id={scopeInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={64}
              value={draftScope}
              onChange={(e) => setDraftScope(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64))}
              placeholder={t("admin_flags_filter_scope_placeholder")}
              autoComplete="off"
            />
          </div>
        </div>
      </form>
      <div className={ADMIN_FILTER_ACTIONS_CLASS}>
        <button
          form="admin-flags-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_flags_apply")}
        </button>
        {hasActiveFilters ? (
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              resetFilters();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_flags_filter_clear")}
            </button>
          </form>
        ) : null}
      </div>
      <p id={adminFilterHintId} className="mt-3 text-meta text-ink-500">
        {t("admin_flags_filter_hint")}
      </p>
      {flagCode ? (
        <p id={flagsActiveCodeDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_flags_active_flag_code").replace("{code}", flagCode)}
        </p>
      ) : null}
      {enabled === "true" || enabled === "false" ? (
        <p id={flagsActiveEnabledDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_flags_active_enabled").replace("{enabled}", enabled)}
        </p>
      ) : null}
      {scope ? (
        <p id={flagsActiveScopeDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_flags_active_scope").replace("{scope}", scope)}
        </p>
      ) : null}
    </div>
  );
}
