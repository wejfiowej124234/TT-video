"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { ADMIN_EMPTY_NEXT_COMMUNITY_POLICY_LOGS_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { SOURCE_MAX, SCOPE_MAX, SUMMARY_MAX, snapPreview } from "./adminCommunityPolicyChangeLogsPageModel";
import { useAdminCommunityPolicyChangeLogsPage } from "./useAdminCommunityPolicyChangeLogsPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

type PolicyLogSortKey = "created_at" | "scope" | "source";
/** 160 §5：社区策略变更审计只读（须 admin + DB）。 */
export function AdminCommunityPolicyChangeLogsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const {
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftScope,
    setDraftScope,
    draftSummary,
    setDraftSummary,
    draftSource,
    setDraftSource,
    draftActorId,
    setDraftActorId,
    apply,
    clearNonLimitFilters,
    hasTextFilters,
  } = useAdminCommunityPolicyChangeLogsPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<PolicyLogSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "created_at") return r.created_at ?? "";
        if (key === "source") return r.source ?? "";
        return r.scope ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_policy_logs_title")}
      subtitle={t("admin_policy_logs_subtitle")}
      headerAside={
        <>
          <Link href="/admin/community/abuse-policy" className={`${adminPageNavLinkClass()}`}>
            {t("admin_policy_logs_linkAbuse")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_policy_logs_back")}
          </Link>
        </>
      }
    >
      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-policy-change-logs-filter-form"
          className="space-y-3"
          aria-label={t("admin_policy_logs_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-small text-ink-700">
              {t("admin_policy_logs_limit")}
              <input
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </label>
            <label className="text-small text-ink-700 block min-w-[8rem] flex-1">
              {t("admin_policy_logs_scope")}
              <input
                type="text"
                value={draftScope}
                onChange={(e) => setDraftScope(e.target.value.slice(0, SCOPE_MAX))}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_policy_logs_scope_ph")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 block min-w-[10rem] flex-1">
              {t("admin_policy_logs_summary")}
              <input
                type="text"
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value.slice(0, SUMMARY_MAX))}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_policy_logs_summary_ph")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 block min-w-[8rem] flex-1">
              {t("admin_policy_logs_source")}
              <input
                type="text"
                value={draftSource}
                onChange={(e) => setDraftSource(e.target.value.slice(0, SOURCE_MAX))}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_policy_logs_source_ph")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 block min-w-[12rem] flex-1">
              {t("admin_policy_logs_actor_id")}
              <input
                type="text"
                value={draftActorId}
                onChange={(e) => setDraftActorId(e.target.value)}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_policy_logs_actor_id_ph")}
                autoComplete="off"
              />
            </label>
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-policy-change-logs-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          >
            {t("admin_policy_logs_apply")}
          </button>
          {hasTextFilters ? (
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
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {t("admin_policy_logs_clear_filters")}
              </button>
            </form>
          ) : null}
        </div>
        {appliedFilters ? (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
            {t("admin_policy_logs_applied")}
            {t("market_fin_colon")}
            {formatAdminAppliedFiltersHuman(appliedFilters, t)}
          </AdminAppliedFiltersBanner>
        ) : null}
      </div>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading ? (
        <AdminListLoadingStatus message={t("admin_policy_logs_loading")} />
      ) : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_policy_logs_empty"
          nextLinks={ADMIN_EMPTY_NEXT_COMMUNITY_POLICY_LOGS_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_policy_logs_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_policy_logs_colTime")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
                <AdminSortableTh
                  label={t("admin_policy_logs_colScope")}
                  ariaSort={ariaSort("scope")}
                  onToggle={() => toggle("scope")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policy_logs_colSummary")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policy_logs_colBefore")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policy_logs_colAfter")}
                </th>
                <AdminSortableTh
                  label={t("admin_policy_logs_colSource")}
                  ariaSort={ariaSort("source")}
                  onToggle={() => toggle("source")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policy_logs_colActor")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {sortedItems.map((r, idx) => {
                const dash = t("admin_em_dash");
                const b = snapPreview(r.before_snapshot, dash);
                const a = snapPreview(r.after_snapshot, dash);
                return (
                  <tr key={r.id ?? `pcl-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.scope ?? dash}</td>
                    <td className="px-3 py-2 max-w-xs truncate" title={r.summary ?? ""}>
                      {r.summary ?? dash}
                    </td>
                    <td className="px-3 py-2 max-w-[10rem] font-mono text-meta">
                      <span className="block truncate" title={b}>
                        {b}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[10rem] font-mono text-meta">
                      <span className="block truncate" title={a}>
                        {a}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.source ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.actor_id ?? ""}>
                      {r.actor_id ?? dash}
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
