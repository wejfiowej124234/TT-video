import { useCallback, useEffect, useRef, useState } from "react";

import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";

import {
  ADMIN_FEE_ROUTER_PAGE_LIMIT,
  type AdminFeeRouterRes,
  type FeeRouteItem,
  type Summary,
} from "./adminFeeRouterPageModel";

export function useAdminFeeRouterPage() {
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
    const q = new URLSearchParams({ limit: String(ADMIN_FEE_ROUTER_PAGE_LIMIT) });
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

  const appliedFiltersKey = appliedFilters == null ? "none" : JSON.stringify(appliedFilters);

  return {
    loading,
    loadingMore,
    error,
    summary,
    items,
    nextCursor,
    hasMore,
    meta,
    appliedFilters,
    appliedFiltersKey,
    onLoadMore,
  };
}