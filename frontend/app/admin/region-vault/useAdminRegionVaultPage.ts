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
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import {
  ADMIN_REGION_VAULT_PAGE_META_KEY,
  ADMIN_REGION_VAULT_SUMMARY_META_KEY,
  type AdminRegionVaultRes,
  type RegionVaultItem,
  type RegionVaultSummary,
  REGION_VAULT_PAGE_LIMIT,
} from "./adminRegionVaultPageModel";

function regionVaultFirstPageToSnapshot(
  body: AdminStandardListBody<RegionVaultItem> & Pick<AdminRegionVaultRes, "summary" | "page">,
): AdminListFetchSnapshot<RegionVaultItem> {
  const base = defaultAdminListFetchSnapshot<RegionVaultItem>(body);
  const meta: Record<string, unknown> = { ...(base.meta ?? {}) };
  if (body.summary && typeof body.summary === "object") {
    meta[ADMIN_REGION_VAULT_SUMMARY_META_KEY] = body.summary;
  }
  if (body.page && typeof body.page === "object") {
    meta[ADMIN_REGION_VAULT_PAGE_META_KEY] = body.page;
  }
  return {
    ...base,
    meta: Object.keys(meta).length > 0 ? meta : null,
  };
}

export function useAdminRegionVaultPage() {
  const chainIdForQueryRef = useRef<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<AdminFetchErrorKind | null>(null);
  const [tailPage, setTailPage] = useState<NonNullable<AdminRegionVaultRes["page"]> | null>(null);

  const listUrl = useMemo(() => {
    const q = new URLSearchParams({ limit: String(REGION_VAULT_PAGE_LIMIT) });
    return `${routes.admin.regionVaultForwardedEvents}?${q}`;
  }, []);

  const { items, setItems, appliedFilters, meta: rawMeta, loading, refreshing, error } =
    useAdminStandardListFetch<RegionVaultItem>({
      scope: "region-vault-forwarded-events",
      context: "AdminRegionVaultPage",
      listUrl,
      toSnapshot: regionVaultFirstPageToSnapshot,
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
    const raw = rawMeta?.[ADMIN_REGION_VAULT_PAGE_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as NonNullable<AdminRegionVaultRes["page"]>;
    }
    return undefined;
  }, [rawMeta]);

  useEffect(() => {
    setTailPage(null);
    setLoadMoreError(null);
  }, [firstPageInfo?.next_cursor, firstPageInfo?.has_more, refreshing]);

  const summary = useMemo((): RegionVaultSummary | null => {
    const raw = rawMeta?.[ADMIN_REGION_VAULT_SUMMARY_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as RegionVaultSummary;
    }
    return null;
  }, [rawMeta]);

  const meta = useMemo(() => {
    if (!rawMeta) return null;
    const {
      [ADMIN_REGION_VAULT_SUMMARY_META_KEY]: _summary,
      [ADMIN_REGION_VAULT_PAGE_META_KEY]: _page,
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
      const headers: Record<string, string> = { "x-request-id": `admin-region-vault-${Date.now()}` };
      try {
        Object.assign(headers, getAuthHeaders());
      } catch {
        // 401/403
      }
      const q = new URLSearchParams({ limit: String(REGION_VAULT_PAGE_LIMIT), cursor: nextCursor });
      const cid = chainIdForQueryRef.current;
      if (cid != null) q.set("chain_id", String(cid));
      try {
        const { res, body } = await adminFetchJson<AdminRegionVaultRes>(
          "AdminRegionVaultPage.loadMore",
          apiUrl(`${routes.admin.regionVaultForwardedEvents}?${q}`),
          { headers },
        );
        if (!res.ok) {
          throw new Error(body.error || body.message || `request_failed_${res.status}`);
        }
        const batch = body.items ?? [];
        setItems((prev) => [...prev, ...batch]);
        setTailPage(body.page ?? null);
      } catch (e: unknown) {
        logAdminFetch("AdminRegionVaultPage.loadMore", e);
        setLoadMoreError(adminFetchErrorKind(e));
      } finally {
        setLoadingMore(false);
      }
    })();
  }, [nextCursor, loadingMore, setItems]);

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
    onLoadMore,
  };
}
