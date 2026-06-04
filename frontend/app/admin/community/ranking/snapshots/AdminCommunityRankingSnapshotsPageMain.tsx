"use client";

import Link from "next/link";
import { useId, useMemo, type FormEvent } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { ADMIN_EMPTY_NEXT_COMMUNITY_RANK_SNAPSHOTS_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  RANK_SNAPSHOTS_FEED_MODE_MAX,
  rankSnapshotsIdsPreview,
} from "./adminCommunityRankingSnapshotsPageModel";
import { useAdminCommunityRankingSnapshotsPage } from "./useAdminCommunityRankingSnapshotsPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

type RankSnapshotSortKey = "created_at" | "feed_mode" | "item_count";
/** 160：Feed 排序快照审计只读（须 admin + DB）。 */
export function AdminCommunityRankingSnapshotsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const limitInputId = useId();
  const feedModeInputId = useId();
  const {
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftFeedMode,
    setDraftFeedMode,
    apply,
    resetFilters,
    hasActiveFilters,
  } = useAdminCommunityRankingSnapshotsPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<RankSnapshotSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "created_at") return r.created_at ?? "";
        if (key === "item_count") return Number(r.item_count) || 0;
        return r.feed_mode ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  const onApply = (e: FormEvent) => apply(e);

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_rank_snapshots_title")}
      subtitle={t("admin_rank_snapshots_subtitle")}
      headerAside={
        <>
          <Link href="/admin/community/reports" className={`${adminPageNavLinkClass()}`}>
            {t("admin_rank_snapshots_linkReports")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_rank_snapshots_back")}
          </Link>
        </>
      }
    >
      <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
        <form
          id="admin-rank-snapshots-filter-form"
          className="space-y-3"
          aria-label={t("admin_rank_snapshots_filters")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={onApply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_rank_snapshots_filters")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[8rem]">
              <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
                {t("admin_rank_snapshots_limit")}
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
            <div className="min-w-[12rem] flex-1">
              <label htmlFor={feedModeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_rank_snapshots_feed_mode")}
              </label>
              <input
                id={feedModeInputId}
                type="text"
                value={draftFeedMode}
                onChange={(e) => setDraftFeedMode(e.target.value.slice(0, RANK_SNAPSHOTS_FEED_MODE_MAX))}
                className={`mt-1 block w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_rank_snapshots_feed_mode_ph")}
                autoComplete="off"
              />
            </div>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-rank-snapshots-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          >
            {t("admin_rank_snapshots_apply")}
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
                {t("admin_rank_snapshots_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_rank_snapshots_applied")}
          {t("market_fin_colon")}
          {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading ? (
        <AdminListLoadingStatus message={t("admin_rank_snapshots_loading")} />
      ) : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_rank_snapshots_empty"
          nextLinks={ADMIN_EMPTY_NEXT_COMMUNITY_RANK_SNAPSHOTS_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_rank_snapshots_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_rank_snapshots_colMode")}
                  ariaSort={ariaSort("feed_mode")}
                  onToggle={() => toggle("feed_mode")}
                />
                <AdminSortableTh
                  label={t("admin_rank_snapshots_colCount")}
                  ariaSort={ariaSort("item_count")}
                  onToggle={() => toggle("item_count")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_rank_snapshots_colTopPosts")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_rank_snapshots_colNotes")}
                </th>
                <AdminSortableTh
                  label={t("admin_rank_snapshots_colCreated")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {sortedItems.map((r, idx) => {
                const dash = t("admin_em_dash");
                const topIds = rankSnapshotsIdsPreview(r.top_post_ids, dash);
                return (
                  <tr key={r.id ?? `rs-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-meta">{r.feed_mode ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.item_count ?? dash}</td>
                    <td className="px-3 py-2 max-w-xl font-mono text-meta">
                      <span className="block truncate" title={topIds}>
                        {topIds}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate" title={r.notes ?? ""}>
                      {r.notes ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
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
