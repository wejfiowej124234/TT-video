"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type AdminReviewRow = {
  id?: string;
  order_id?: string;
  reviewer_id?: string;
  reviewee_id?: string;
  score?: number;
  weight?: number;
  comment?: string | null;
  created_at?: string;
};

type AdminReviewsRes = {
  status?: string;
  items?: AdminReviewRow[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

function clampLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

function parseOptionalI16(s: string | null): number | undefined {
  if (s == null) return undefined;
  const v = s.trim();
  if (v === "") return undefined;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(32767, Math.max(-32768, n));
}

/** 与列表请求一致：无任何 query 时默认低分抽样（max_score=2）；一旦 URL 含任一键则按 URL 解析（缺省键不补默认 max）。 */
function parseReviewsListQuery(sp: URLSearchParams): {
  limit: number;
  minScore?: number;
  maxScore?: number;
} {
  const hasAny = sp.has("limit") || sp.has("min_score") || sp.has("max_score");
  const limit = clampLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const minScore = parseOptionalI16(sp.get("min_score"));
  let maxScore = parseOptionalI16(sp.get("max_score"));
  if (!hasAny) {
    maxScore = 2;
  }
  return { limit, minScore, maxScore };
}

function buildReviewsListPath(q: { limit: number; minScore?: number; maxScore?: number }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampLimit(q.limit)));
  if (q.minScore != null) sp.set("min_score", String(q.minScore));
  if (q.maxScore != null) sp.set("max_score", String(q.maxScore));
  return `/admin/reviews?${sp.toString()}`;
}

function parseDraftLimit(s: string): number {
  const n = Number.parseInt(s.trim(), 10);
  return clampLimit(n);
}

function parseDraftScore(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(32767, Math.max(-32768, n));
}

/** Phase 5 / 07：低分评价运营抽样（GET /api/v1/admin/reviews） */
function AdminReviewsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseReviewsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [itemsNotArrayError, setItemsNotArrayError] = useState(false);
  const [items, setItems] = useState<AdminReviewRow[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftMax, setDraftMax] = useState(
    listQ.maxScore != null ? String(listQ.maxScore) : "",
  );
  const [draftMin, setDraftMin] = useState(
    listQ.minScore != null ? String(listQ.minScore) : "",
  );

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftMax(listQ.maxScore != null ? String(listQ.maxScore) : "");
    setDraftMin(listQ.minScore != null ? String(listQ.minScore) : "");
  }, [listQ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setItemsNotArrayError(false);
    setMeta(null);

    const path = routes.admin.reviews({
      limit: listQ.limit,
      ...(listQ.minScore != null ? { min_score: listQ.minScore } : {}),
      ...(listQ.maxScore != null ? { max_score: listQ.maxScore } : {}),
    });

    const headers: Record<string, string> = { "x-request-id": `admin-reviews-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // allow 401/403
    }

    adminFetchJson<AdminReviewsRes>("AdminReviewsPage", apiUrl(path), { headers })
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        const rawItems = body.items;
        if (rawItems == null) {
          setItems([]);
          setItemsNotArrayError(false);
        } else if (!Array.isArray(rawItems)) {
          if (typeof window !== "undefined") {
            console.error("AdminReviewsPage: items is not an array", rawItems);
          }
          setItems([]);
          setItemsNotArrayError(true);
        } else {
          setItems(rawItems);
          setItemsNotArrayError(false);
        }
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminReviewsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const limit = parseDraftLimit(draftLimit);
    const minScore = parseDraftScore(draftMin);
    const maxScore = parseDraftScore(draftMax);
    router.push(
      buildReviewsListPath({
        limit,
        ...(minScore != null ? { minScore } : {}),
        ...(maxScore != null ? { maxScore } : {}),
      }),
    );
  };

  const presetLow = (e?: FormEvent) => {
    e?.preventDefault();
    router.push(buildReviewsListPath({ limit: 100, maxScore: 2 }));
  };

  const clearScores = (e?: FormEvent) => {
    e?.preventDefault();
    router.push(buildReviewsListPath({ limit: parseDraftLimit(draftLimit) }));
  };

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_reviews_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_reviews_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-reviews-filter-form"
          aria-label={t("admin_reviews_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_reviews_filters")}</p>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-small text-ink-700">
              {t("admin_reviews_limit")}
              <input
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`ml-2 min-h-[44px] w-24 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_reviews_maxScore")}
              <input
                type="text"
                inputMode="numeric"
                value={draftMax}
                onChange={(e) => setDraftMax(e.target.value)}
                className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_reviews_maxScorePh")}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_reviews_minScore")}
              <input
                type="text"
                inputMode="numeric"
                value={draftMin}
                onChange={(e) => setDraftMin(e.target.value)}
                className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_reviews_minScorePh")}
              />
            </label>
          </div>
          {appliedFilters && (
            <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
              {t("admin_reviews_applied")}: {JSON.stringify(appliedFilters)}
            </AdminAppliedFiltersBanner>
          )}
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button
            form="admin-reviews-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-600 px-3 py-1.5 text-small font-medium text-white hover:bg-travel-700 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_reviews_apply")}
          </button>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              presetLow();
            }}
          >
            <button
              type="submit"
              className={`${touchTargetLink44Classes} text-small text-travel-600 underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_reviews_presetLow")}
            </button>
          </form>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              clearScores();
            }}
          >
            <button
              type="submit"
              className={`${touchTargetLink44Classes} text-small text-ink-600 underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_reviews_clearScores")}
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_loading")}
        </p>
      )}

      {error ? (
        <div className="mt-6">
          <ApiErrorAlert message={adminErrorUserText(error, t)} />
        </div>
      ) : null}

      {!error && itemsNotArrayError && (
        <p
          className="mt-6 rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 p-3 text-body text-ink-800"
          role="alert"
        >
          {t("admin_reviews_itemsNotArray")}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && !itemsNotArrayError && (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_reviews_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin_reviews_colScore")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_reviews_colOrder")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_reviews_colReviewer")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_reviews_colComment")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_reviews_colCreated")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_reviews_colOps")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-ink-500" colSpan={6}>
                    {t("admin_empty_table")}
                  </td>
                </tr>
              )}
              {items.map((r) => (
                <tr key={r.id ?? `${r.order_id}-${r.reviewer_id}`}>
                  <td className="px-4 py-3 font-mono">{r.score ?? t("admin_em_dash")}</td>
                  <td className="px-4 py-3 font-mono text-meta break-all">{r.order_id ?? t("admin_em_dash")}</td>
                  <td className="px-4 py-3 font-mono text-meta break-all">
                    {r.reviewer_id ? `${r.reviewer_id.slice(0, 8)}…` : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3 max-w-md truncate" title={r.comment ?? undefined}>
                    {r.comment?.trim() ? r.comment : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    {r.order_id ? (
                      <div className="flex flex-col gap-1 items-start">
                        {r.id ? (
                          <Link
                            href={`/admin/reviews/${encodeURIComponent(r.id)}`}
                            className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                          >
                            {t("admin_ops_reviewDetailAdmin")}
                          </Link>
                        ) : null}
                        <Link
                          href={`/escrow/${encodeURIComponent(r.order_id)}`}
                          onClick={() => {
                            const oid = r.order_id;
                            if (oid) stashEscrowOrderPrefetchForOrderIdNav(oid, "escrow");
                          }}
                          className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                        >
                          {t("admin_ops_orderEscrow")}
                        </Link>
                        <Link
                          href={`/pay?orderId=${encodeURIComponent(r.order_id)}`}
                          onClick={() => {
                            const oid = r.order_id;
                            if (oid) stashEscrowOrderPrefetchForOrderIdNav(oid, "pay");
                          }}
                          className={`${touchTargetLink44Classes} text-travel-600/90 hover:underline text-meta whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                        >
                          {t("admin_ops_payHub")}
                        </Link>
                      </div>
                    ) : (
                      t("admin_em_dash")
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default function AdminReviewsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_reviews_title">
      <AdminReviewsPageInner />
    </AdminSearchParamsSuspense>
  );
}

