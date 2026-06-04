"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { FormEvent } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { ADMIN_EMPTY_NEXT_COMMUNITY_RISK_SIGNALS_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  adminRiskSignalsContextPreview,
  type AdminRiskSignalRow,
} from "./adminRiskSignalsPageModel";
import type { AdminCommunityRiskSignalsPageViewModel } from "./useAdminCommunityRiskSignalsPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

type RiskSignalSortKey = "created_at" | "severity" | "signal_type";
export function AdminCommunityRiskSignalsPageMain(vm: AdminCommunityRiskSignalsPageViewModel) {
  const { t } = useTranslation();
  const {
    pageTitleId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftSubject,
    setDraftSubject,
    draftSignalType,
    setDraftSignalType,
    draftRuleId,
    setDraftRuleId,
    draftSeverity,
    setDraftSeverity,
    apply,
    clearNonLimitFilters,
    hasTextFilters,
    stMax,
    ridMax,
    sevMax,
  } = vm;

  const { sort, toggle, ariaSort } = useAdminTableSort<RiskSignalSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "created_at") return r.created_at ?? "";
        if (key === "severity") return r.severity ?? "";
        return r.signal_type ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_risk_signals_title")}
      subtitle={t("admin_risk_signals_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_risk_signals_back")}
          </Link>
        </>
      }
    >
      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-risk-signals-filter-form"
          className="space-y-3"
          aria-label={t("admin_risk_signals_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <p className="text-small font-medium text-ink-800">{t("admin_risk_signals_filters")}</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-small text-ink-700">
              {t("admin_risk_signals_limit")}
              <input
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </label>
            <label className="text-small text-ink-700 min-w-[10rem] flex-1">
              {t("admin_risk_signals_subject")}
              <input
                type="text"
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                className={`ml-2 w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_risk_signals_subjectPh")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 min-w-[8rem] flex-1">
              {t("admin_risk_signals_signalType")}
              <input
                type="text"
                value={draftSignalType}
                onChange={(e) => setDraftSignalType(e.target.value.slice(0, stMax))}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_risk_signals_signalTypePh")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 min-w-[8rem] flex-1">
              {t("admin_risk_signals_ruleId")}
              <input
                type="text"
                value={draftRuleId}
                onChange={(e) => setDraftRuleId(e.target.value.slice(0, ridMax))}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_risk_signals_ruleIdPh")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 min-w-[6rem] flex-1">
              {t("admin_risk_signals_severity")}
              <input
                type="text"
                value={draftSeverity}
                onChange={(e) => setDraftSeverity(e.target.value.slice(0, sevMax))}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_risk_signals_severityPh")}
                autoComplete="off"
              />
            </label>
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-risk-signals-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          >
            {t("admin_risk_signals_apply")}
          </button>
          {hasTextFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                clearNonLimitFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small text-ink-700 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {t("admin_risk_signals_clear_filters")}
              </button>
            </form>
          ) : null}
        </div>
        {appliedFilters ? (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
            {t("admin_risk_signals_applied")}
            {t("market_fin_colon")}
            {formatAdminAppliedFiltersHuman(appliedFilters, t)}
          </AdminAppliedFiltersBanner>
        ) : null}
      </div>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {loading ? (
        <AdminListLoadingStatus message={t("admin_risk_signals_loading")} />
      ) : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_risk_signals_empty"
          nextLinks={ADMIN_EMPTY_NEXT_COMMUNITY_RISK_SIGNALS_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_risk_signals_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_risk_signals_colTime")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_risk_signals_colSubject")}
                </th>
                <AdminSortableTh
                  label={t("admin_risk_signals_colType")}
                  ariaSort={ariaSort("signal_type")}
                  onToggle={() => toggle("signal_type")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_risk_signals_colRule")}
                </th>
                <AdminSortableTh
                  label={t("admin_risk_signals_colSev")}
                  ariaSort={ariaSort("severity")}
                  onToggle={() => toggle("severity")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_risk_signals_colCtx")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {sortedItems.map((r: AdminRiskSignalRow, idx: number) => {
                const dash = t("admin_em_dash");
                const ctx = adminRiskSignalsContextPreview(r.context, dash);
                return (
                  <tr key={r.id ?? `rs-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[9rem] truncate" title={r.subject_user_id}>
                      {r.subject_user_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.signal_type ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.rule_id ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.severity ?? dash}</td>
                    <td className="px-3 py-2 max-w-md font-mono text-meta">
                      <span className="block truncate" title={ctx}>
                        {ctx}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </AdminListPageChrome>
  );
}
