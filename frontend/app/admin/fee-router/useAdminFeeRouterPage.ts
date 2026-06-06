import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  defaultAdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import {
  ADMIN_FEE_ROUTER_PAGE_LIMIT,
  ADMIN_FEE_ROUTER_PAGE_META_KEY,
  ADMIN_FEE_ROUTER_SUMMARY_META_KEY,
  type AdminFeeRouterRes,
  type FeeRouteItem,
  type Summary,
} from "./adminFeeRouterPageModel";

function feeRouterFirstPageToSnapshot(
  body: AdminStandardListBody<FeeRouteItem> & Pick<AdminFeeRouterRes, "summary" | "page">,
) {
  const base = defaultAdminListFetchSnapshot(body);
  const meta: Record<string, unknown> = { ...(base.meta ?? {}) };
  if (body.summary && typeof body.summary === "object") {
    meta[ADMIN_FEE_ROUTER_SUMMARY_META_KEY] = body.summary;
  }
  if (body.page && typeof body.page === "object") {
    meta[ADMIN_FEE_ROUTER_PAGE_META_KEY] = body.page;
  }
  return {
    ...base,
    meta: Object.keys(meta).length > 0 ? meta : null,
  };
}

export function useAdminFeeRouterPage() {
  const chainIdForQueryRef = useRef<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<AdminFetchErrorKind | null>(null);
  const [tailPage, setTailPage] = useState<NonNullable<AdminFeeRouterRes["page"]> | null>(null);

  const listUrl = useMemo(() => {
    const q = new URLSearchParams({ limit: String(ADMIN_FEE_ROUTER_PAGE_LIMIT) });
    return `${routes.admin.feeRouterRoutedEvents}?${q}`;
  }, []);

  const { items, setItems, appliedFilters, meta: rawMeta, loading, refreshing, error } =
    useAdminStandardListFetch<FeeRouteItem>({
      scope: "fee-router-routed-events",
      context: "AdminFeeRouterPage",
      listUrl,
      toSnapshot: feeRouterFirstPageToSnapshot,
    });

  useEffect(() => {
    const af = appliedFilters;
    if (af && typeof af.chain_id === "number" && Number.isFinite(af.chain_id)) {
      chainIdForQueryRef.current = af.chain_id;
    } else {
      chainIdForQueryRef.current = null;
    }
  }, [appliedFilters]);

  const firstPageInfo = useMemo(() => {
    const raw = rawMeta?.[ADMIN_FEE_ROUTER_PAGE_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as NonNullable<AdminFeeRouterRes["page"]>;
    }
    return undefined;
  }, [rawMeta]);

  useEffect(() => {
    setTailPage(null);
    setLoadMoreError(null);
  }, [firstPageInfo?.next_cursor, firstPageInfo?.has_more, refreshing]);

  const summary = useMemo((): Summary | null => {
    const raw = rawMeta?.[ADMIN_FEE_ROUTER_SUMMARY_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as Summary;
    }
    return null;
  }, [rawMeta]);

  const meta = useMemo(() => {
    if (!rawMeta) return null;
    const {
      [ADMIN_FEE_ROUTER_SUMMARY_META_KEY]: _summary,
      [ADMIN_FEE_ROUTER_PAGE_META_KEY]: _page,
      ...rest
    } = rawMeta;
    return isAdminMetaRecord(rest) && Object.keys(rest).length > 0 ? rest : null;
  }, [rawMeta]);

  const pageInfo = tailPage ?? firstPageInfo;
  const nextCursor = pageInfo?.next_cursor ?? null;
  const hasMore = Boolean(pageInfo?.has_more);

  const onLoadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    void (async () => {
      const headers: Record<string, string> = { "x-request-id": `admin-fee-router-${Date.now()}` };
      try {
        Object.assign(headers, getAuthHeaders());
      } catch {
        // 401/403
      }
      const q = new URLSearchParams({ limit: String(ADMIN_FEE_ROUTER_PAGE_LIMIT), cursor: nextCursor });
      const cid = chainIdForQueryRef.current;
      if (cid != null) q.set("chain_id", String(cid));
      try {
        const { res, body } = await adminFetchJson<AdminFeeRouterRes>(
          "AdminFeeRouterPage.loadMore",
          apiUrl(`${routes.admin.feeRouterRoutedEvents}?${q}`),
          { headers },
        );
        if (!res.ok) {
          throw new Error(body.error || body.message || `request_failed_${res.status}`);
        }
        const batch = body.items ?? [];
        setItems((prev) => [...prev, ...batch]);
        setTailPage(body.page ?? null);
      } catch (e: unknown) {
        logAdminFetch("AdminFeeRouterPage.loadMore", e);
        setLoadMoreError(adminFetchErrorKind(e));
      } finally {
        setLoadingMore(false);
      }
    })();
  }, [nextCursor, loadingMore, setItems]);

  const appliedFiltersKey = appliedFilters == null ? "none" : JSON.stringify(appliedFilters);

  return {
    loading,
    refreshing,
    loadingMore,
    error: error ?? loadMoreError,
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
