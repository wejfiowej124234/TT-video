"use client";

import { API_VER_SUB_MAX } from "./adminApiVersionsPageModel";
import type { AdminApiVersionsPageViewModel } from "./useAdminApiVersionsPage";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_HINT_CLASS} from "@/lib/adminUi";
type Props = { vm: AdminApiVersionsPageViewModel };

export function AdminApiVersionsFiltersCard({ vm }: Props) {
  const {
    t,
    limitInputId,
    versionInputId,
    statusInputId,
    adminFilterHintId,
    apiVersionsActiveVersionDescId,
    apiVersionsActiveStatusDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    apiVersion,
    status,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftApiVersion,
    setDraftApiVersion,
    draftStatus,
    setDraftStatus,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  } = vm;

  return (
    <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
      <form
        id="admin-api-versions-filter-form"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label={t("admin_api_versions_filters")}
        aria-describedby={
          [
            adminListApplyResetHintId,
            adminFilterHintId,
            apiVersion ? apiVersionsActiveVersionDescId : "",
            status ? apiVersionsActiveStatusDescId : "",
            appliedFilters ? adminAppliedFiltersDescId : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
      >
        <p id={adminListApplyResetHintId} className={`w-full ${ADMIN_FILTER_HINT_CLASS} sm:basis-full`}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="min-w-[8rem]">
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_api_versions_limit")}
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
          <label htmlFor={versionInputId} className="block text-small font-medium text-ink-600">
            {t("admin_api_versions_filter_version")}
          </label>
          <input
            id={versionInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            maxLength={API_VER_SUB_MAX}
            value={draftApiVersion}
            onChange={(e) => setDraftApiVersion(e.target.value.slice(0, API_VER_SUB_MAX))}
            placeholder={t("admin_api_versions_filter_version_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[10rem]">
          <label htmlFor={statusInputId} className="block text-small font-medium text-ink-600">
            {t("admin_api_versions_filter_status")}
          </label>
          <select
            id={statusInputId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
          >
            <option value="">{t("admin_api_versions_filter_status_any")}</option>
            <option value="planned">planned</option>
            <option value="active">active</option>
            <option value="deprecated">deprecated</option>
            <option value="sunset">sunset</option>
          </select>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          form="admin-api-versions-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_api_versions_apply")}
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
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_api_versions_filter_clear")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
