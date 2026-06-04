"use client";

import type { AdminTenantScopesPageViewModel } from "./useAdminTenantScopesPage";
import { REGION_MAX, TENANT_KEY_MAX } from "./adminTenantScopesPageConstants";
import {ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
type Props = Pick<
  AdminTenantScopesPageViewModel,
  | "t"
  | "apply"
  | "resetFilters"
  | "hasActiveFilters"
  | "limitInputId"
  | "tenantKeyInputId"
  | "regionCodeInputId"
  | "statusSelectId"
  | "scopeClassSelectId"
  | "adminListApplyResetHintId"
  | "adminFilterHintId"
  | "tenantScopesActiveKeyDescId"
  | "tenantScopesActiveRegionDescId"
  | "tenantScopesActiveStatusDescId"
  | "tenantScopesActiveScopeClassDescId"
  | "adminAppliedFiltersDescId"
  | "draftLimit"
  | "setDraftLimit"
  | "draftTenantKey"
  | "setDraftTenantKey"
  | "draftRegionCode"
  | "setDraftRegionCode"
  | "draftStatus"
  | "setDraftStatus"
  | "draftScopeClass"
  | "setDraftScopeClass"
  | "tenantKey"
  | "regionCode"
  | "status"
  | "scopeClass"
  | "loading"
  | "error"
  | "appliedFilters"
>;

export function AdminTenantScopesFilterCard({
  t,
  apply,
  resetFilters,
  hasActiveFilters,
  limitInputId,
  tenantKeyInputId,
  regionCodeInputId,
  statusSelectId,
  scopeClassSelectId,
  adminListApplyResetHintId,
  adminFilterHintId,
  tenantScopesActiveKeyDescId,
  tenantScopesActiveRegionDescId,
  tenantScopesActiveStatusDescId,
  tenantScopesActiveScopeClassDescId,
  adminAppliedFiltersDescId,
  draftLimit,
  setDraftLimit,
  draftTenantKey,
  setDraftTenantKey,
  draftRegionCode,
  setDraftRegionCode,
  draftStatus,
  setDraftStatus,
  draftScopeClass,
  setDraftScopeClass,
  tenantKey,
  regionCode,
  status,
  scopeClass,
  loading,
  error,
  appliedFilters,
}: Props) {
  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
      <form
        id="admin-tenant-scopes-filter-form"
        className="space-y-3"
        aria-label={t("admin_tenant_scopes_filters")}
        aria-describedby={
          [
            adminListApplyResetHintId,
            adminFilterHintId,
            tenantKey ? tenantScopesActiveKeyDescId : "",
            regionCode ? tenantScopesActiveRegionDescId : "",
            status ? tenantScopesActiveStatusDescId : "",
            scopeClass ? tenantScopesActiveScopeClassDescId : "",
            !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
      >
        <p className="text-small font-medium text-ink-800">{t("admin_tenant_scopes_filters")}</p>
        <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[8rem]">
            <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
              {t("admin_tenant_scopes_limit")}
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
          <div className="min-w-[10rem] flex-1">
            <label htmlFor={tenantKeyInputId} className="block text-small font-medium text-ink-600">
              {t("admin_tenant_scopes_filter_tenant_key")}
            </label>
            <input
              id={tenantKeyInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={TENANT_KEY_MAX}
              value={draftTenantKey}
              onChange={(e) => setDraftTenantKey(e.target.value.slice(0, TENANT_KEY_MAX))}
              placeholder={t("admin_tenant_scopes_filter_tenant_key_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label htmlFor={regionCodeInputId} className="block text-small font-medium text-ink-600">
              {t("admin_tenant_scopes_filter_region_code")}
            </label>
            <input
              id={regionCodeInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={REGION_MAX}
              value={draftRegionCode}
              onChange={(e) => setDraftRegionCode(e.target.value.slice(0, REGION_MAX))}
              placeholder={t("admin_tenant_scopes_filter_region_code_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[9rem]">
            <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
              {t("admin_tenant_scopes_filter_status")}
            </label>
            <select
              id={statusSelectId}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="">{t("admin_tenant_scopes_status_any")}</option>
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="sunset">sunset</option>
            </select>
          </div>
          <div className="min-w-[11rem]">
            <label htmlFor={scopeClassSelectId} className="block text-small font-medium text-ink-600">
              {t("admin_tenant_scopes_filter_scope_class")}
            </label>
            <select
              id={scopeClassSelectId}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftScopeClass}
              onChange={(e) => setDraftScopeClass(e.target.value)}
            >
              <option value="">{t("admin_tenant_scopes_scope_class_any")}</option>
              <option value="data_residency">data_residency</option>
              <option value="ops">ops</option>
              <option value="feature">feature</option>
              <option value="network">network</option>
            </select>
          </div>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          form="admin-tenant-scopes-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_tenant_scopes_apply")}
        </button>
        {hasActiveFilters ? (
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              resetFilters();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_tenant_scopes_filter_clear")}
            </button>
          </form>
        ) : null}
      </div>
      <p id={adminFilterHintId} className="mt-3 text-meta text-ink-500">
        {t("admin_tenant_scopes_filter_hint")}
      </p>
      {tenantKey ? (
        <p id={tenantScopesActiveKeyDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tenant_scopes_active_tenant_key").replace("{key}", tenantKey)}
        </p>
      ) : null}
      {regionCode ? (
        <p id={tenantScopesActiveRegionDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tenant_scopes_active_region").replace("{region}", regionCode)}
        </p>
      ) : null}
      {status ? (
        <p id={tenantScopesActiveStatusDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tenant_scopes_active_status").replace("{status}", status)}
        </p>
      ) : null}
      {scopeClass ? (
        <p id={tenantScopesActiveScopeClassDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tenant_scopes_active_scope_class").replace("{class}", scopeClass)}
        </p>
      ) : null}
    </div>
  );
}
