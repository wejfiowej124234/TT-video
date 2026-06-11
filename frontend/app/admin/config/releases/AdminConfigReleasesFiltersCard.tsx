"use client";

import { RELEASE_KEY_MAX_LEN } from "./configReleasesPageModel";
import type { AdminConfigReleasesPageViewModel } from "./useAdminConfigReleasesPage";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_HINT_CLASS, ADMIN_FILTER_CARD_CLASS} from "@/lib/adminUi";
type Props = { vm: AdminConfigReleasesPageViewModel };

export function AdminConfigReleasesFiltersCard({ vm }: Props) {
  const {
    t,
    releaseKeyInputId,
    statusSelectId,
    limitInputId,
    adminFilterHintId,
    configReleasesActiveKeyDescId,
    configReleasesActiveStatusDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    releaseKey,
    status,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftReleaseKey,
    setDraftReleaseKey,
    draftStatus,
    setDraftStatus,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  } = vm;

  return (
    <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
      <form
        id="admin-config-releases-filter-form"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label={t("admin_config_releases_filters")}
        aria-describedby={
          [
            adminListApplyResetHintId,
            adminFilterHintId,
            releaseKey ? configReleasesActiveKeyDescId : "",
            status ? configReleasesActiveStatusDescId : "",
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
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={releaseKeyInputId} className="block text-small font-medium text-ink-600">
            {t("admin_config_releases_filter_release_key")}
          </label>
          <input
            id={releaseKeyInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            maxLength={RELEASE_KEY_MAX_LEN}
            value={draftReleaseKey}
            onChange={(e) => setDraftReleaseKey(e.target.value.slice(0, RELEASE_KEY_MAX_LEN))}
            placeholder={t("admin_config_releases_filter_release_key_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[11rem]">
          <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
            {t("admin_config_releases_filter_status")}
          </label>
          <select
            id={statusSelectId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
          >
            <option value="">{t("admin_config_releases_status_any")}</option>
            <option value="draft">{t("admin_config_releases_status_draft")}</option>
            <option value="published">{t("admin_config_releases_status_published")}</option>
            <option value="rolled_back">{t("admin_config_releases_status_rolled_back")}</option>
          </select>
        </div>
        <div>
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_config_releases_limit")}
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
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          form="admin-config-releases-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_config_releases_apply")}
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
              {t("admin_config_releases_filter_clear")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
