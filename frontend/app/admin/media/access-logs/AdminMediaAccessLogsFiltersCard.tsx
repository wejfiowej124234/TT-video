"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  MEDIA_ACCESS_LOGS_ACTION_MAX,
  MEDIA_ACCESS_LOGS_ACTOR_MAX,
  MEDIA_ACCESS_LOGS_OBJECT_MAX,
} from "./adminMediaAccessLogsPageModel";
import type { AdminMediaAccessLogsPageViewModel } from "./useAdminMediaAccessLogsPage";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_HINT_CLASS} from "@/lib/adminUi";
type Props = {
  vm: AdminMediaAccessLogsPageViewModel;
  limitInputId: string;
  actionInputId: string;
  objectInputId: string;
  actorInputId: string;
  tokenInputId: string;
  adminListApplyResetHintId: string;
  adminFilterHintId: string;
  adminAppliedFiltersDescId: string;
};

export function AdminMediaAccessLogsFiltersCard({
  vm,
  limitInputId,
  actionInputId,
  objectInputId,
  actorInputId,
  tokenInputId,
  adminListApplyResetHintId,
  adminFilterHintId,
  adminAppliedFiltersDescId,
}: Props) {
  const { t } = useTranslation();
  const {
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftAction,
    setDraftAction,
    draftObjectId,
    setDraftObjectId,
    draftActor,
    setDraftActor,
    draftToken,
    setDraftToken,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  } = vm;

  return (
    <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
      <form
        id="admin-media-access-logs-filter-form"
        className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
        aria-label={t("admin_media_access_logs_filters")}
        aria-describedby={[adminListApplyResetHintId, adminFilterHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")}
        onSubmit={apply}
      >
        <p id={adminListApplyResetHintId} className={`w-full ${ADMIN_FILTER_HINT_CLASS} lg:basis-full`}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="min-w-[8rem]">
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_limit")}
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
        <div className="min-w-[8rem] flex-1">
          <label htmlFor={actionInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_filter_action")}
          </label>
          <input
            id={actionInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            maxLength={MEDIA_ACCESS_LOGS_ACTION_MAX}
            value={draftAction}
            onChange={(e) => setDraftAction(e.target.value.slice(0, MEDIA_ACCESS_LOGS_ACTION_MAX))}
            placeholder={t("admin_media_access_logs_filter_action_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={objectInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_filter_object_id")}
          </label>
          <input
            id={objectInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            maxLength={MEDIA_ACCESS_LOGS_OBJECT_MAX}
            value={draftObjectId}
            onChange={(e) => setDraftObjectId(e.target.value.slice(0, MEDIA_ACCESS_LOGS_OBJECT_MAX))}
            placeholder={t("admin_media_access_logs_filter_object_id_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[9rem] flex-1">
          <label htmlFor={actorInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_filter_actor")}
          </label>
          <input
            id={actorInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            maxLength={MEDIA_ACCESS_LOGS_ACTOR_MAX}
            value={draftActor}
            onChange={(e) => setDraftActor(e.target.value.slice(0, MEDIA_ACCESS_LOGS_ACTOR_MAX))}
            placeholder={t("admin_media_access_logs_filter_actor_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={tokenInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_filter_token_id")}
          </label>
          <input
            id={tokenInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={draftToken}
            onChange={(e) => setDraftToken(e.target.value)}
            placeholder={t("admin_media_access_logs_filter_token_id_placeholder")}
            autoComplete="off"
          />
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          form="admin-media-access-logs-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_media_access_logs_apply")}
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
              {t("admin_media_access_logs_filter_clear")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
