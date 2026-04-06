"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
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

type Summary = {
  total?: number;
  max_block_number?: number | null;
  min_block_number?: number | null;
  latest_inserted_at?: string | null;
  chain_id_filter?: number | null;
};

type FeeRouteItem = {
  id: string;
  chain_id: number;
  block_number: number;
  log_index: number;
  tx_hash: string;
  token_address: string;
  amount_u256_hex: string;
  to_country_u256_hex: string;
  to_stakers_u256_hex: string;
  to_reserve_u256_hex: string;
  to_ops_u256_hex: string;
  inserted_at: string;
};

type AdminFeeRouterRes = {
  status?: string;
  summary?: Summary;
  items?: FeeRouteItem[];
  page?: { has_more?: boolean; next_cursor?: string | null };
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
  message?: string;
};

const PAGE_LIMIT = 25;

function shortHex(s: string, head = 6, tail = 4): string {
  const t = s.trim();
  if (t.length <= head + tail + 2) return t;
  return `${t.slice(0, head + 2)}…${t.slice(-tail)}`;
}

export default function AdminFeeRouterPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const feeRouterLoadMoreFilterHintId = useId();
  const chainIdForQueryRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<FeeRouteItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const fetchPage = useCallback(async (cursor: string | null, append: boolean) => {
    if (!append) {
      chainIdForQueryRef.current = null;
    }
    const headers: Record<string, string> = { "x-request-id": `admin-fee-router-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }
    const q = new URLSearchParams({ limit: String(PAGE_LIMIT) });
    if (cursor) q.set("cursor", cursor);
    const cid = chainIdForQueryRef.current;
    if (cid != null) q.set("chain_id", String(cid));
    const { res, body } = await adminFetchJson<AdminFeeRouterRes>(
      "AdminFeeRouterPage",
      apiUrl(`${routes.admin.feeRouterRoutedEvents}?${q}`),
      { headers }
    );
    if (!res.ok) {
      throw new Error(body.error || body.message || `request_failed_${res.status}`);
    }
    const batch = body.items ?? [];
    if (append) {
      setItems((prev) => [...prev, ...batch]);
    } else {
      setItems(batch);
      setSummary(body.summary ?? null);
      setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
    }
    setHasMore(Boolean(body.page?.has_more));
    setNextCursor(body.page?.next_cursor ?? null);
    const af = body.applied_filters;
    if (af && typeof af.chain_id === "number" && Number.isFinite(af.chain_id)) {
      chainIdForQueryRef.current = af.chain_id;
    } else if (!append) {
      chainIdForQueryRef.current = null;
    }
    setAppliedFilters(body.applied_filters ?? null);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    fetchPage(null, false)
      .catch((e: unknown) => {
        logAdminFetch("AdminFeeRouterPage.initial", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [fetchPage]);

  const onLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchPage(nextCursor, true)
      .catch((e: unknown) => {
        logAdminFetch("AdminFeeRouterPage.loadMore", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoadingMore(false));
  };

  const appliedFiltersKey =
    appliedFilters == null ? "none" : JSON.stringify(appliedFilters);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_fee_router_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_fee_router_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin/finance"
            className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_finance_title")}
          </Link>
          <Link
            href="/admin/region-vault"
            className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_region_vault_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_loading")}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && summary && (
        <section
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label={t("admin_fee_router_summary_aria")}
          aria-describedby={
            [appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ") || undefined
          }
        >
          <Link
            href="#admin-fee-router-events"
            className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            <h2 className="text-body font-medium text-ink-800">{t("admin_fee_router_summaryTotal")}</h2>
            <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.total ?? 0}</p>
          </Link>
          <Link
            href="#admin-fee-router-events"
            className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            <h2 className="text-body font-medium text-ink-800">{t("admin_fee_router_blockRange")}</h2>
            <p className="mt-2 font-mono text-small text-ink-700">
              {summary.min_block_number ?? t("admin_em_dash")} →{" "}
              {summary.max_block_number ?? t("admin_em_dash")}
            </p>
          </Link>
          <Link
            href="#admin-fee-router-events"
            className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 sm:col-span-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            <h2 className="text-body font-medium text-ink-800">{t("admin_fee_router_latestInserted")}</h2>
            <p className="mt-2 font-mono text-small text-ink-700">
              {summary.latest_inserted_at ?? t("admin_em_dash")}
            </p>
          </Link>
        </section>
      )}

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner
          key={appliedFiltersKey}
          id={adminAppliedFiltersDescId}
          variant="card"
          className="mt-6"
        >
          {t("admin_fee_router_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section
          id="admin-fee-router-events"
          className="mt-8 scroll-mt-24 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200"
          aria-label={t("admin_fee_router_events_table_aria")}
        >
          <table className="min-w-full border-collapse text-left text-small">
            <thead className="bg-ink-50 text-meta font-medium uppercase text-ink-600">
              <tr>
                <th className="px-3 py-2">{t("admin_fee_router_colChain")}</th>
                <th className="px-3 py-2">{t("admin_fee_router_colBlockLog")}</th>
                <th className="px-3 py-2">{t("admin_fee_router_colTx")}</th>
                <th className="px-3 py-2">{t("admin_fee_router_colToken")}</th>
                <th className="px-3 py-2">{t("admin_fee_router_colAmount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 font-mono text-meta text-ink-800">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="whitespace-nowrap px-3 py-2">{row.chain_id}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.block_number}:{row.log_index}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.tx_hash}>
                    {shortHex(row.tx_hash)}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.token_address}>
                    {shortHex(row.token_address)}
                  </td>
                  <td className="max-w-[6rem] truncate px-3 py-2" title={row.amount_u256_hex}>
                    {shortHex(row.amount_u256_hex, 4, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!loading && !error && items.length === 0 && summary && (summary.total ?? 0) === 0 && (
        <p id="admin-fee-router-events" className="mt-6 scroll-mt-24 text-body text-ink-500">
          {t("admin_fee_router_empty")}
        </p>
      )}

      {hasMore && nextCursor && (
        <div className="mt-6">
          <p id={feeRouterLoadMoreFilterHintId} className="mb-2 max-w-2xl text-meta text-ink-600">
            {t("admin_fee_router_load_more_filter_hint")}
          </p>
          <form
            className="inline"
            aria-describedby={[appliedFilters ? adminAppliedFiltersDescId : null, feeRouterLoadMoreFilterHintId]
              .filter(Boolean)
              .join(" ")}
            onSubmit={(e) => {
              e.preventDefault();
              onLoadMore();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              disabled={loadingMore}
              aria-busy={loadingMore ? true : undefined}
            >
              {loadingMore ? t("admin_fee_router_loadingMore") : t("admin_fee_router_loadMore")}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
