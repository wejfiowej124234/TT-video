"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { OBJECT_MAX } from "./adminMediaSignedUrlTokensPageModel";
import type { AdminMediaSignedUrlTokensPageViewModel } from "./useAdminMediaSignedUrlTokensPage";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_HINT_CLASS, ADMIN_FILTER_CARD_CLASS} from "@/lib/adminUi";
type Props = {
  vm: AdminMediaSignedUrlTokensPageViewModel;
  limitInputId: string;
  objectInputId: string;
  scopeInputId: string;
  issuedInputId: string;
  tokenInputId: string;
  adminAppliedFiltersDescId: string;
  adminListApplyResetHintId: string;
};

export function AdminMediaSignedUrlTokensFiltersCard({
  vm,
  limitInputId,
  objectInputId,
  scopeInputId,
  issuedInputId,
  tokenInputId,
  adminAppliedFiltersDescId,
  adminListApplyResetHintId,
}: Props) {
  const { t } = useTranslation();
  const {
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftObjectId,
    setDraftObjectId,
    draftUrlScope,
    setDraftUrlScope,
    draftIssuedTo,
    setDraftIssuedTo,
    draftTokenId,
    setDraftTokenId,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  } = vm;

  return (
    <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
      <form
        id="admin-media-signed-url-tokens-filter-form"
        className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
        aria-label={t("admin_media_signed_url_tokens_filters")}
        aria-describedby={
          [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
        }
        onSubmit={apply}
      >
        <p id={adminListApplyResetHintId} className={`w-full ${ADMIN_FILTER_HINT_CLASS} lg:basis-full`}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="min-w-[8rem]">
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_limit")}
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
          <label htmlFor={objectInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_filter_object_id")}
          </label>
          <input
            id={objectInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            maxLength={OBJECT_MAX}
            value={draftObjectId}
            onChange={(e) => setDraftObjectId(e.target.value.slice(0, OBJECT_MAX))}
            placeholder={t("admin_media_signed_url_tokens_filter_object_id_ph")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[10rem]">
          <label htmlFor={scopeInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_filter_scope")}
          </label>
          <select
            id={scopeInputId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={draftUrlScope}
            onChange={(e) => setDraftUrlScope(e.target.value)}
          >
            <option value="">{t("admin_media_signed_url_tokens_scope_any")}</option>
            <option value="read">read</option>
            <option value="download">download</option>
          </select>
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={issuedInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_filter_issued_to")}
          </label>
          <input
            id={issuedInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={draftIssuedTo}
            onChange={(e) => setDraftIssuedTo(e.target.value)}
            placeholder={t("admin_media_signed_url_tokens_filter_issued_to_ph")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={tokenInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_filter_token_id")}
          </label>
          <input
            id={tokenInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={draftTokenId}
            onChange={(e) => setDraftTokenId(e.target.value)}
            placeholder={t("admin_media_signed_url_tokens_filter_token_id_ph")}
            autoComplete="off"
          />
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          form="admin-media-signed-url-tokens-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_media_signed_url_tokens_apply")}
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
              {t("admin_media_signed_url_tokens_clear")}
            </button>
          </form>
        ) : null}
      </div>
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-1 w-full lg:basis-full">
          {t("admin_media_signed_url_tokens_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}
    </div>
  );
}
