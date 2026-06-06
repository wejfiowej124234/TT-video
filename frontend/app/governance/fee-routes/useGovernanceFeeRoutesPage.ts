import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import { getFeeRouterAddress } from "@/lib/feeRouterEnv";
import { normalizeEvmAddr, rawFeeRouterFromMeta } from "@/lib/feeRouterWiring";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  FEE_ROUTES_PAGE_LIMIT,
  governanceMetaHttpErrorLine,
  resolveConfiguredChainId,
  type FeeRouteItem,
  type FeeRoutesRes,
  type GovernanceFeeRoutesMetaJson,
} from "./governanceFeeRoutesPageModel";

export function useGovernanceFeeRoutesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FeeRouteItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [metaReady, setMetaReady] = useState(false);
  const [metaHttpError, setMetaHttpError] = useState<string | null>(null);
  const [configuredChainId, setConfiguredChainId] = useState<number | null>(null);
  const [scopeMetaChain, setScopeMetaChain] = useState(true);
  const [metaFeeRouterRaw, setMetaFeeRouterRaw] = useState<string | null>(null);
  const [metaContractsLoaded, setMetaContractsLoaded] = useState(false);

  const buildTimeFeeRouter = useMemo(() => getFeeRouterAddress(), []);
  const normalizedMetaFr = useMemo(() => normalizeEvmAddr(metaFeeRouterRaw), [metaFeeRouterRaw]);
  const feeRouterEnvMetaMismatch =
    Boolean(normalizedMetaFr && buildTimeFeeRouter && normalizedMetaFr !== buildTimeFeeRouter);

  const effectiveChainId =
    metaReady && scopeMetaChain && configuredChainId != null ? configuredChainId : undefined;

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean, chainId: number | undefined) => {
      const headers: Record<string, string> = { "x-request-id": `fee-routes-${Date.now()}` };
      try {
        Object.assign(headers, getAuthHeaders());
      } catch {
        /* optional auth */
      }
      const q = new URLSearchParams({ limit: String(FEE_ROUTES_PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      if (chainId !== undefined) q.set("chain_id", String(chainId));
      const { res, body: data } = await fetchJsonWithApiStatusLog<FeeRoutesRes>(
        "governanceFeeRoutes",
        apiUrl(`${routes.governanceFeeRoutes}?${q}`),
        { headers }
      );
      if (!res.ok) {
        throw new Error(t("governance_requestFailed"));
      }
      const batch = data.items ?? [];
      if (append) {
        setItems((prev) => [...prev, ...batch]);
      } else {
        setItems(batch);
      }
      setHasMore(Boolean(data.page?.has_more));
      setNextCursor(data.page?.next_cursor ?? null);
      setNote(typeof data.note === "string" ? data.note : null);
    },
    [t],
  );

  useEffect(() => {
    fetchJsonWithApiStatusLog<GovernanceFeeRoutesMetaJson>("GovernanceFeeRoutesPage.meta", apiUrl(routes.meta))
      .then(({ res, body }) => {
        if (!res.ok) {
          setMetaHttpError(governanceMetaHttpErrorLine(res.status, body, t));
          setMetaContractsLoaded(false);
          setMetaFeeRouterRaw(null);
          setConfiguredChainId(null);
          setScopeMetaChain(false);
          return;
        }
        setMetaHttpError(null);
        const b = body as GovernanceFeeRoutesMetaJson;
        const contracts = b?.chain?.contracts;
        setMetaContractsLoaded(contracts != null && typeof contracts === "object");
        setMetaFeeRouterRaw(rawFeeRouterFromMeta(b));
        const id = resolveConfiguredChainId(b);
        setConfiguredChainId(id);
        setScopeMetaChain(id != null);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("GovernanceFeeRoutesPage meta fetch:", err);
        }
        setMetaHttpError(mapApiReadError(err, t, "governance_requestFailed"));
        setMetaFeeRouterRaw(null);
        setMetaContractsLoaded(false);
        setConfiguredChainId(null);
        setScopeMetaChain(false);
      })
      .finally(() => setMetaReady(true));
  }, [t]);

  useEffect(() => {
    if (!metaReady) return;
    setLoading(true);
    setError(null);
    setLoadMoreError(null);
    fetchPage(null, false, effectiveChainId)
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("GovernanceFeeRoutesPage initial:", e);
        }
        setError(mapApiReadError(e, t, "governance_requestFailed"));
      })
      .finally(() => setLoading(false));
  }, [metaReady, effectiveChainId, fetchPage, t]);

  const onLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    fetchPage(nextCursor, true, effectiveChainId)
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("GovernanceFeeRoutesPage loadMore:", e);
        }
        setLoadMoreError(mapApiReadError(e, t, "governance_requestFailed"));
      })
      .finally(() => setLoadingMore(false));
  };

  return {
    t,
    items,
    nextCursor,
    hasMore,
    note,
    loading,
    loadingMore,
    error,
    loadMoreError,
    setLoadMoreError,
    metaReady,
    metaHttpError,
    configuredChainId,
    scopeMetaChain,
    setScopeMetaChain,
    metaFeeRouterRaw,
    metaContractsLoaded,
    buildTimeFeeRouter,
    feeRouterEnvMetaMismatch,
    onLoadMore,
  };
}
