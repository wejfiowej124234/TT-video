"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { KEY_ALIAS_MAX_LEN } from "./adminSecretsMetadataPageModel";
import type { AdminSecretsMetadataPageViewModel } from "./useAdminSecretsMetadataPage";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_HINT_CLASS, ADMIN_FILTER_CARD_CLASS} from "@/lib/adminUi";
type Props = Pick<
  AdminSecretsMetadataPageViewModel,
  | "keyAlias"
  | "status"
  | "envScope"
  | "appliedFilters"
  | "draftLimit"
  | "setDraftLimit"
  | "draftKeyAlias"
  | "setDraftKeyAlias"
  | "draftStatus"
  | "setDraftStatus"
  | "draftEnvScope"
  | "setDraftEnvScope"
  | "apply"
  | "clearNonLimitFilters"
  | "hasActiveFilters"
> & {
  keyAliasInputId: string;
  statusSelectId: string;
  envScopeInputId: string;
  limitInputId: string;
  adminListApplyResetHintId: string;
  adminFilterHintId: string;
  secretsActiveKeyAliasDescId: string;
  secretsActiveStatusDescId: string;
  secretsActiveEnvScopeDescId: string;
  adminAppliedFiltersDescId: string;
};

export function AdminSecretsMetadataFiltersCard({
  keyAliasInputId,
  statusSelectId,
  envScopeInputId,
  limitInputId,
  adminListApplyResetHintId,
  adminFilterHintId,
  secretsActiveKeyAliasDescId,
  secretsActiveStatusDescId,
  secretsActiveEnvScopeDescId,
  adminAppliedFiltersDescId,
  keyAlias,
  status,
  envScope,
  appliedFilters,
  draftLimit,
  setDraftLimit,
  draftKeyAlias,
  setDraftKeyAlias,
  draftStatus,
  setDraftStatus,
  draftEnvScope,
  setDraftEnvScope,
  apply,
  clearNonLimitFilters,
  hasActiveFilters,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
      <form
        id="admin-secrets-metadata-filter-form"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label={t("admin_secrets_meta_filters")}
        aria-describedby={
          [
            adminListApplyResetHintId,
            adminFilterHintId,
            keyAlias ? secretsActiveKeyAliasDescId : "",
            status ? secretsActiveStatusDescId : "",
            envScope ? secretsActiveEnvScopeDescId : "",
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
          <label htmlFor={keyAliasInputId} className="block text-small font-medium text-ink-600">
            {t("admin_secrets_meta_filter_key_alias")}
          </label>
          <input
            id={keyAliasInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            maxLength={KEY_ALIAS_MAX_LEN}
            value={draftKeyAlias}
            onChange={(e) => setDraftKeyAlias(e.target.value.slice(0, KEY_ALIAS_MAX_LEN))}
            placeholder={t("admin_secrets_meta_filter_key_alias_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[11rem]">
          <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
            {t("admin_secrets_meta_filter_status")}
          </label>
          <select
            id={statusSelectId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
          >
            <option value="">{t("admin_secrets_meta_status_any")}</option>
            <option value="active">{t("admin_secrets_meta_status_active")}</option>
            <option value="deprecated">{t("admin_secrets_meta_status_deprecated")}</option>
            <option value="revoked">{t("admin_secrets_meta_status_revoked")}</option>
            <option value="pending">{t("admin_secrets_meta_status_pending")}</option>
            <option value="suspended">{t("admin_secrets_meta_status_suspended")}</option>
          </select>
        </div>
        <div className="min-w-[8rem] flex-1">
          <label htmlFor={envScopeInputId} className="block text-small font-medium text-ink-600">
            {t("admin_secrets_meta_filter_env_scope")}
          </label>
          <input
            id={envScopeInputId}
            className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            maxLength={64}
            value={draftEnvScope}
            onChange={(e) => setDraftEnvScope(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64))}
            placeholder={t("admin_secrets_meta_filter_env_scope_placeholder")}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_secrets_meta_limit")}
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
          form="admin-secrets-metadata-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_secrets_meta_apply")}
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
              {t("admin_secrets_meta_filter_clear")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
