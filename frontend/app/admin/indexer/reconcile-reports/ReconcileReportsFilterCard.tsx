"use client";

import type { FormEvent } from "react";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import type { ProjectionCleanFilter } from "./reconcileReportsPageModel";
import {ADMIN_FILTER_CARD_CLASS, ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
import {
  buildListPath,
  CHAIN_ID_PARAM_MAX_LEN,
  ISSUES_MIN_INPUT_MAX_LEN,
  KNOWN_REPORT_TYPES,
  limitSelectOptions,
  RECONCILE_REPORTS_FILTER_FORM_ID,
  REPORT_TYPE_MAX_LEN,
} from "./reconcileReportsPageModel";

type TFn = (key: string) => string;

export function ReconcileReportsFilterCard(props: {
  t: TFn;
  router: { push: (path: string) => void };
  reportType: string;
  chainIdStr: string;
  projectionClean: ProjectionCleanFilter;
  issuesMinStr: string;
  limit: number;
  loading: boolean;
  error: unknown;
  appliedFilters: Record<string, unknown> | null;
  hasActiveFilters: boolean;
  filterDraft: string;
  setFilterDraft: (v: string) => void;
  chainFilterDraft: string;
  setChainFilterDraft: (v: string) => void;
  cleanFilterDraft: ProjectionCleanFilter;
  setCleanFilterDraft: (v: ProjectionCleanFilter) => void;
  issuesMinDraft: string;
  setIssuesMinDraft: (v: string) => void;
  onApplyFilters: (e?: FormEvent) => void;
  onResetFilters: () => void;
  reportTypeInputId: string;
  chainIdInputId: string;
  projectionCleanSelectId: string;
  issuesMinInputId: string;
  limitSelectId: string;
  datalistId: string;
  reconcileReportFilterHintId: string;
  reconcileChainFilterHintId: string;
  reconcileIssuesMinHintId: string;
  reconcileActiveReportTypeDescId: string;
  reconcileActiveChainDescId: string;
  reconcileActiveCleanDescId: string;
  reconcileActiveIssuesMinDescId: string;
  adminAppliedFiltersDescId: string;
  adminListApplyResetHintId: string;
}) {
  const {
    t,
    router,
    reportType,
    chainIdStr,
    projectionClean,
    issuesMinStr,
    limit,
    loading,
    error,
    appliedFilters,
    hasActiveFilters,
    filterDraft,
    setFilterDraft,
    chainFilterDraft,
    setChainFilterDraft,
    cleanFilterDraft,
    setCleanFilterDraft,
    issuesMinDraft,
    setIssuesMinDraft,
    onApplyFilters,
    onResetFilters,
    reportTypeInputId,
    chainIdInputId,
    projectionCleanSelectId,
    issuesMinInputId,
    limitSelectId,
    datalistId,
    reconcileReportFilterHintId,
    reconcileChainFilterHintId,
    reconcileIssuesMinHintId,
    reconcileActiveReportTypeDescId,
    reconcileActiveChainDescId,
    reconcileActiveCleanDescId,
    reconcileActiveIssuesMinDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
  } = props;

  const limitOptions = limitSelectOptions(limit);

  return (
    <>
      <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
        <form
          id={RECONCILE_REPORTS_FILTER_FORM_ID}
          className="space-y-3"
          aria-label={t("admin_indexer_reconcile_reports_filters_aria")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              reconcileReportFilterHintId,
              reconcileChainFilterHintId,
              reconcileIssuesMinHintId,
              reportType ? reconcileActiveReportTypeDescId : "",
              chainIdStr ? reconcileActiveChainDescId : "",
              projectionClean === "true" || projectionClean === "false" ? reconcileActiveCleanDescId : "",
              issuesMinStr ? reconcileActiveIssuesMinDescId : "",
              !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={onApplyFilters}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_indexer_reconcile_reports_filters_heading")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[12rem] flex-1">
              <label htmlFor={reportTypeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_indexer_reconcile_reports_filter_label")}
              </label>
              <input
                id={reportTypeInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                name="report_type"
                list={datalistId}
                maxLength={REPORT_TYPE_MAX_LEN}
                value={filterDraft}
                onChange={(e) => setFilterDraft(e.target.value.slice(0, REPORT_TYPE_MAX_LEN))}
                placeholder={t("admin_indexer_reconcile_reports_filter_placeholder")}
                autoComplete="off"
              />
              <datalist id={datalistId}>
                {KNOWN_REPORT_TYPES.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <p id={reconcileReportFilterHintId} className="mt-1 text-meta text-ink-500">
                {t("admin_indexer_reconcile_reports_filter_hint")}
              </p>
            </div>
            <div className="min-w-[10rem] flex-1 sm:max-w-[14rem]">
              <label htmlFor={chainIdInputId} className="block text-small font-medium text-ink-600">
                {t("admin_indexer_reconcile_reports_chain_filter_label")}
              </label>
              <input
                id={chainIdInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                name="chain_id"
                inputMode="numeric"
                maxLength={CHAIN_ID_PARAM_MAX_LEN}
                value={chainFilterDraft}
                onChange={(e) => setChainFilterDraft(e.target.value.slice(0, CHAIN_ID_PARAM_MAX_LEN))}
                placeholder="e.g. 31337"
                autoComplete="off"
              />
              <p id={reconcileChainFilterHintId} className="mt-1 text-meta text-ink-500">
                {t("admin_indexer_reconcile_reports_chain_filter_hint")}
              </p>
            </div>
            <div className="min-w-[11rem] flex-1 sm:max-w-[16rem]">
              <label htmlFor={projectionCleanSelectId} className="block text-small font-medium text-ink-600">
                {t("admin_indexer_reconcile_reports_clean_filter_label")}
              </label>
              <select
                id={projectionCleanSelectId}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                value={cleanFilterDraft}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "true" || v === "false" || v === "") setCleanFilterDraft(v);
                }}
              >
                <option value="">{t("admin_indexer_reconcile_reports_clean_filter_any")}</option>
                <option value="true">{t("admin_indexer_reconcile_reports_clean_filter_yes")}</option>
                <option value="false">{t("admin_indexer_reconcile_reports_clean_filter_no")}</option>
              </select>
            </div>
            <div className="min-w-[9rem] flex-1 sm:max-w-[12rem]">
              <label htmlFor={issuesMinInputId} className="block text-small font-medium text-ink-600">
                {t("admin_indexer_reconcile_reports_issues_min_label")}
              </label>
              <input
                id={issuesMinInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                name="issues_min"
                inputMode="numeric"
                maxLength={ISSUES_MIN_INPUT_MAX_LEN}
                value={issuesMinDraft}
                onChange={(e) =>
                  setIssuesMinDraft(e.target.value.replace(/\D/g, "").slice(0, ISSUES_MIN_INPUT_MAX_LEN))
                }
                placeholder="≥ 1"
                autoComplete="off"
              />
              <p id={reconcileIssuesMinHintId} className="mt-1 text-meta text-ink-500">
                {t("admin_indexer_reconcile_reports_issues_min_hint")}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <label htmlFor={limitSelectId} className="block text-small font-medium text-ink-600">
                {t("admin_indexer_reconcile_reports_per_page_label")}
              </label>
              <select
                id={limitSelectId}
                className={`mt-1 inline-flex w-full min-h-[44px] min-w-[7rem] items-center justify-start rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small text-ink-900 sm:w-auto ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                value={limit}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  if (!Number.isFinite(next)) return;
                  router.push(
                    buildListPath({
                      page: 1,
                      limit: next,
                      reportType,
                      chainIdStr,
                      projectionClean,
                      issuesMinStr,
                    }),
                  );
                }}
              >
                {limitOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form={RECONCILE_REPORTS_FILTER_FORM_ID}
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          >
            {t("admin_indexer_reconcile_reports_filter_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                onResetFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {t("admin_indexer_reconcile_reports_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {reportType ? (
        <p id={reconcileActiveReportTypeDescId} className="mt-2 text-meta text-ink-600">
          {t("admin_indexer_reconcile_reports_active_filter").replace("{type}", reportType)}
        </p>
      ) : null}
      {chainIdStr ? (
        <p id={reconcileActiveChainDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_indexer_reconcile_reports_active_chain").replace("{id}", chainIdStr)}
        </p>
      ) : null}
      {projectionClean === "true" || projectionClean === "false" ? (
        <p id={reconcileActiveCleanDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_indexer_reconcile_reports_active_clean").replace(
            "{v}",
            projectionClean === "true"
              ? t("admin_indexer_reconcile_reports_clean_filter_yes")
              : t("admin_indexer_reconcile_reports_clean_filter_no"),
          )}
        </p>
      ) : null}
      {issuesMinStr ? (
        <p id={reconcileActiveIssuesMinDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_indexer_reconcile_reports_active_issues_min").replace("{n}", issuesMinStr)}
        </p>
      ) : null}
      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_indexer_reconcile_reports_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}
    </>
  );
}
