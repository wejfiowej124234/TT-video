"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { useTranslation } from "@/components/LocaleProvider";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type Row = {
  id?: string;
  feed_mode?: string;
  item_count?: number;
  top_post_ids?: string[];
  notes?: string | null;
  created_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const FM_MAX = 128;

function idsPreview(ids: string[] | undefined, dash: string): string {
  if (!ids || ids.length === 0) return dash;
  const s = ids.join(", ");
  return s.length > 120 ? `${s.slice(0, 120)}…` : s;
}

function parseRankSnapshotsQuery(sp: URLSearchParams): { limit: number; feedMode: string } {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const feedMode = (sp.get("feed_mode") ?? "").trim().slice(0, FM_MAX);
  return { limit, feedMode };
}

function buildRankSnapshotsPath(q: { limit: number; feedMode: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const fm = q.feedMode.trim().slice(0, FM_MAX);
  if (fm) sp.set("feed_mode", fm);
  return `/admin/community/ranking/snapshots?${sp.toString()}`;
}

/** 160：Feed 排序快照审计只读（须 admin + DB）。 */
function AdminCommunityRankingSnapshotsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const limitInputId = useId();
  const feedModeInputId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, feedMode } = useMemo(
    () => parseRankSnapshotsQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftFeedMode, setDraftFeedMode] = useState(feedMode);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftFeedMode(feedMode);
  }, [limit, feedMode]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-rank-snap-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminCommunityRankingSnapshotsPage",
      apiUrl(
        routes.admin.communityRankingSnapshots({
          limit,
          ...(feedMode ? { feed_mode: feedMode } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityRankingSnapshotsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, feedMode]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildRankSnapshotsPath({
        limit: nextLimit,
        feedMode: draftFeedMode.trim().slice(0, FM_MAX),
      }),
    );
  };

  const resetFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildRankSnapshotsPath({ limit: nextLimit, feedMode: "" }));
  };

  const hasActiveFilters = Boolean(feedMode);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_rank_snapshots_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_rank_snapshots_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          <Link href="/admin/community/reports" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_rank_snapshots_linkReports")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_rank_snapshots_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-rank-snapshots-filter-form"
          className="space-y-3"
          aria-label={t("admin_rank_snapshots_filters")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
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
                className={`mt-1 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 ${travelFocusRingCoreOffset2WhiteClasses}`}
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
                onChange={(e) => setDraftFeedMode(e.target.value.slice(0, FM_MAX))}
                className={`mt-1 block w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
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
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
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
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_rank_snapshots_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_rank_snapshots_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_rank_snapshots_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_rank_snapshots_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_rank_snapshots_colMode")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_rank_snapshots_colCount")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_rank_snapshots_colTopPosts")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_rank_snapshots_colNotes")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_rank_snapshots_colCreated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={5}>
                    {t("admin_rank_snapshots_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                const topIds = idsPreview(r.top_post_ids, dash);
                return (
                  <tr key={r.id ?? `rs-${idx}`}>
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
    </main>
  );
}

export default function AdminCommunityRankingSnapshotsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_rank_snapshots_title"
      backLinkLabelKey="admin_rank_snapshots_back"
    >
      <AdminCommunityRankingSnapshotsPageInner />
    </AdminSearchParamsSuspense>
  );
}
