"use client";

import type { FormEvent } from "react";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
import {
  BINDING_ROLE_MAX,
  POLICY_CODE_MAX,
  SCOPE_TYPE_MAX,
} from "./adminPoliciesPageConstants";

type TFn = (key: string) => string;

export type AdminPoliciesFilterCardProps = {
  t: TFn;
  apply: (e?: FormEvent) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  limitInputId: string;
  policyCodeInputId: string;
  statusSelectId: string;
  scopeTypeInputId: string;
  bindingRoleInputId: string;
  adminListApplyResetHintId: string;
  adminFilterHintId: string;
  policiesActiveCodeDescId: string;
  policiesActiveStatusDescId: string;
  policiesActiveScopeTypeDescId: string;
  policiesActiveBindingRoleDescId: string;
  adminAppliedFiltersDescId: string;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftPolicyCode: string;
  setDraftPolicyCode: (v: string) => void;
  draftStatus: string;
  setDraftStatus: (v: string) => void;
  draftScopeType: string;
  setDraftScopeType: (v: string) => void;
  draftBindingRole: string;
  setDraftBindingRole: (v: string) => void;
  policyCode: string;
  status: string;
  scopeType: string;
  bindingRole: string;
  loading: boolean;
  error: AdminFetchErrorKind | null;
  appliedFilters: Record<string, unknown> | null;
};

export function AdminPoliciesFilterCard(props: AdminPoliciesFilterCardProps) {
  const {
    t,
    apply,
    resetFilters,
    hasActiveFilters,
    limitInputId,
    policyCodeInputId,
    statusSelectId,
    scopeTypeInputId,
    bindingRoleInputId,
    adminListApplyResetHintId,
    adminFilterHintId,
    policiesActiveCodeDescId,
    policiesActiveStatusDescId,
    policiesActiveScopeTypeDescId,
    policiesActiveBindingRoleDescId,
    adminAppliedFiltersDescId,
    draftLimit,
    setDraftLimit,
    draftPolicyCode,
    setDraftPolicyCode,
    draftStatus,
    setDraftStatus,
    draftScopeType,
    setDraftScopeType,
    draftBindingRole,
    setDraftBindingRole,
    policyCode,
    status,
    scopeType,
    bindingRole,
    loading,
    error,
    appliedFilters,
  } = props;

  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
      <form
        id="admin-policies-filter-form"
        className="space-y-3"
        aria-label={t("admin_policies_filters")}
        aria-describedby={
          [
            adminListApplyResetHintId,
            adminFilterHintId,
            policyCode ? policiesActiveCodeDescId : "",
            status === "draft" || status === "active" || status === "deprecated" ? policiesActiveStatusDescId : "",
            scopeType ? policiesActiveScopeTypeDescId : "",
            bindingRole ? policiesActiveBindingRoleDescId : "",
            !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
      >
        <p className="text-small font-medium text-ink-800">{t("admin_policies_filters")}</p>
        <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[8rem]">
            <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
              {t("admin_policies_limit")}
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
            <label htmlFor={policyCodeInputId} className="block text-small font-medium text-ink-600">
              {t("admin_policies_filter_policy_code")}
            </label>
            <input
              id={policyCodeInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={POLICY_CODE_MAX}
              value={draftPolicyCode}
              onChange={(e) => setDraftPolicyCode(e.target.value.slice(0, POLICY_CODE_MAX))}
              placeholder={t("admin_policies_filter_policy_code_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[9rem]">
            <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
              {t("admin_policies_filter_status")}
            </label>
            <select
              id={statusSelectId}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="">{t("admin_policies_status_any")}</option>
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="deprecated">deprecated</option>
            </select>
          </div>
          <div className="min-w-[8rem] flex-1">
            <label htmlFor={scopeTypeInputId} className="block text-small font-medium text-ink-600">
              {t("admin_policies_filter_scope_type")}
            </label>
            <input
              id={scopeTypeInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={SCOPE_TYPE_MAX}
              value={draftScopeType}
              onChange={(e) => setDraftScopeType(e.target.value.slice(0, SCOPE_TYPE_MAX))}
              placeholder={t("admin_policies_filter_scope_type_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label htmlFor={bindingRoleInputId} className="block text-small font-medium text-ink-600">
              {t("admin_policies_filter_binding_role")}
            </label>
            <input
              id={bindingRoleInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={BINDING_ROLE_MAX}
              value={draftBindingRole}
              onChange={(e) => setDraftBindingRole(e.target.value.slice(0, BINDING_ROLE_MAX))}
              placeholder={t("admin_policies_filter_binding_role_placeholder")}
              autoComplete="off"
            />
          </div>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          form="admin-policies-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_policies_apply")}
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
              {t("admin_policies_filter_clear")}
            </button>
          </form>
        ) : null}
      </div>
      <p id={adminFilterHintId} className="mt-3 text-meta text-ink-500">
        {t("admin_policies_filter_hint")}
      </p>
      {policyCode ? (
        <p id={policiesActiveCodeDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_policies_active_policy_code").replace("{code}", policyCode)}
        </p>
      ) : null}
      {status === "draft" || status === "active" || status === "deprecated" ? (
        <p id={policiesActiveStatusDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_policies_active_status").replace("{status}", status)}
        </p>
      ) : null}
      {scopeType ? (
        <p id={policiesActiveScopeTypeDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_policies_active_scope_type").replace("{type}", scopeType)}
        </p>
      ) : null}
      {bindingRole ? (
        <p id={policiesActiveBindingRoleDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_policies_active_binding_role").replace("{role}", bindingRole)}
        </p>
      ) : null}
    </div>
  );
}
