"use client";

import type { FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_HINT_CLASS, ADMIN_FILTER_CARD_CLASS} from "@/lib/adminUi";
import {
  LIFECYCLE_DOMAIN_MAX,
  LIFECYCLE_ENTITY_MAX,
  LIFECYCLE_MACHINE_CODE_MAX,
  LIFECYCLE_SOT_MAX,
  LIFECYCLE_VERSION_MAX,
} from "./adminLifecyclePageModel";

type AdminLifecycleFiltersBlockProps = {
  limitInputId: string;
  machineInputId: string;
  domainInputId: string;
  entityInputId: string;
  versionInputId: string;
  sotInputId: string;
  anomalyInputId: string;
  adminListApplyResetHintId: string;
  adminFilterHintId: string;
  adminAppliedFiltersDescId: string;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftMachine: string;
  setDraftMachine: (v: string) => void;
  draftDomain: string;
  setDraftDomain: (v: string) => void;
  draftEntity: string;
  setDraftEntity: (v: string) => void;
  draftVersion: string;
  setDraftVersion: (v: string) => void;
  draftSot: string;
  setDraftSot: (v: string) => void;
  draftAnomaly: string;
  setDraftAnomaly: (v: string) => void;
  apply: (e?: FormEvent) => void;
  clearNonLimitFilters: () => void;
  hasActiveFilters: boolean;
};

export function AdminLifecycleFiltersBlock({
  limitInputId,
  machineInputId,
  domainInputId,
  entityInputId,
  versionInputId,
  sotInputId,
  anomalyInputId,
  adminListApplyResetHintId,
  adminFilterHintId,
  adminAppliedFiltersDescId,
  appliedFilters,
  draftLimit,
  setDraftLimit,
  draftMachine,
  setDraftMachine,
  draftDomain,
  setDraftDomain,
  draftEntity,
  setDraftEntity,
  draftVersion,
  setDraftVersion,
  draftSot,
  setDraftSot,
  draftAnomaly,
  setDraftAnomaly,
  apply,
  clearNonLimitFilters,
  hasActiveFilters,
}: AdminLifecycleFiltersBlockProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
        <form
          id="admin-lifecycle-filter-form"
          className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
          aria-label={t("admin_lifecycle_filters")}
          aria-describedby={
            [adminListApplyResetHintId, adminFilterHintId, appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className={`w-full ${ADMIN_FILTER_HINT_CLASS} lg:basis-full`}>
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="min-w-[8rem]">
            <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
              {t("admin_lifecycle_limit")}
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
          <div className="min-w-[9rem] flex-1">
            <label htmlFor={machineInputId} className="block text-small font-medium text-ink-600">
              {t("admin_lifecycle_filter_machine")}
            </label>
            <input
              id={machineInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={LIFECYCLE_MACHINE_CODE_MAX}
              value={draftMachine}
              onChange={(e) => setDraftMachine(e.target.value.slice(0, LIFECYCLE_MACHINE_CODE_MAX))}
              placeholder={t("admin_lifecycle_filter_machine_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[7rem] flex-1">
            <label htmlFor={domainInputId} className="block text-small font-medium text-ink-600">
              {t("admin_lifecycle_filter_domain")}
            </label>
            <input
              id={domainInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={LIFECYCLE_DOMAIN_MAX}
              value={draftDomain}
              onChange={(e) => setDraftDomain(e.target.value.slice(0, LIFECYCLE_DOMAIN_MAX))}
              placeholder={t("admin_lifecycle_filter_domain_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label htmlFor={entityInputId} className="block text-small font-medium text-ink-600">
              {t("admin_lifecycle_filter_entity")}
            </label>
            <input
              id={entityInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={LIFECYCLE_ENTITY_MAX}
              value={draftEntity}
              onChange={(e) => setDraftEntity(e.target.value.slice(0, LIFECYCLE_ENTITY_MAX))}
              placeholder={t("admin_lifecycle_filter_entity_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[6rem] flex-1">
            <label htmlFor={versionInputId} className="block text-small font-medium text-ink-600">
              {t("admin_lifecycle_filter_version")}
            </label>
            <input
              id={versionInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={LIFECYCLE_VERSION_MAX}
              value={draftVersion}
              onChange={(e) => setDraftVersion(e.target.value.slice(0, LIFECYCLE_VERSION_MAX))}
              placeholder={t("admin_lifecycle_filter_version_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[9rem] flex-1">
            <label htmlFor={sotInputId} className="block text-small font-medium text-ink-600">
              {t("admin_lifecycle_filter_sot")}
            </label>
            <input
              id={sotInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={LIFECYCLE_SOT_MAX}
              value={draftSot}
              onChange={(e) => setDraftSot(e.target.value.slice(0, LIFECYCLE_SOT_MAX))}
              placeholder={t("admin_lifecycle_filter_sot_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[8rem]">
            <label htmlFor={anomalyInputId} className="block text-small font-medium text-ink-600">
              {t("admin_lifecycle_filter_anomaly")}
            </label>
            <select
              id={anomalyInputId}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftAnomaly}
              onChange={(e) => setDraftAnomaly(e.target.value)}
            >
              <option value="">{t("admin_lifecycle_filter_anomaly_any")}</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-lifecycle-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          >
            {t("admin_lifecycle_apply")}
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
                {t("admin_lifecycle_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_lifecycle_filter_hint")}
      </p>
    </>
  );
}
