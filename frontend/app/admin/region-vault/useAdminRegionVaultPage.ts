import { useCallback, useEffect, useRef, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import {
  type AdminRegionVaultRes,
  type RegionVaultItem,
  type RegionVaultSummary,
  REGION_VAULT_PAGE_LIMIT,
} from "./adminRegionVaultPageModel";

export function useAdminRegionVaultPage() {
  const chainIdForQueryRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [summary, setSummary] = useState<RegionVaultSummary | null>(null);
  const [items, setItems] = useState<RegionVaultItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const fetchPage = useCallback(async (cursor: string | null, append: boolean) => {
    if (!append) {
      chainIdForQueryRef.current = null;
    }
    const headers: Record<string, string> = { "x-request-id": `admin-region-vault-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }
    const q = new URLSearchParams({ limit: String(REGION_VAULT_PAGE_LIMIT) });
    if (cursor) q.set("cursor", cursor);
    const cid = chainIdForQueryRef.current;
    if (cid != null) q.set("chain_id", String(cid));
    const { res, body } = await adminFetchJson<AdminRegionVaultRes>(
      "AdminRegionVaultPage",
      apiUrl(`${routes.admin.regionVaultForwardedEvents}?${q}`),
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
        logAdminFetch("AdminRegionVaultPage.initial", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [fetchPage]);

  const onLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchPage(nextCursor, true)
      .catch((e: unknown) => {
        logAdminFetch("AdminRegionVaultPage.loadMore", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoadingMore(false));
  };

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
    onLoadMore,
  };
}
