import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  governanceMetaHttpErrorLine,
  resolveConfiguredChainId,
  type GovernanceVaultForwardsMetaJson,
  type VaultForwardItem,
  type VaultForwardsRes,
  VAULT_FORWARDS_PAGE_LIMIT,
} from "./governanceVaultForwardsPageModel";

export function useGovernanceVaultForwardsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<VaultForwardItem[]>([]);
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
  const [metaVaultRaw, setMetaVaultRaw] = useState<string | null>(null);
  const [metaContractsLoaded, setMetaContractsLoaded] = useState(false);

  const effectiveChainId =
    metaReady && scopeMetaChain && configuredChainId != null ? configuredChainId : undefined;

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean, chainId: number | undefined) => {
      const headers: Record<string, string> = { "x-request-id": `vault-forwards-${Date.now()}` };
      try {
        Object.assign(headers, getAuthHeaders());
      } catch {
        /* optional auth */
      }
      const q = new URLSearchParams({ limit: String(VAULT_FORWARDS_PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      if (chainId !== undefined) q.set("chain_id", String(chainId));
      const { res, body: data } = await fetchJsonWithApiStatusLog<VaultForwardsRes>(
        "governanceVaultForwards",
        apiUrl(`${routes.governanceVaultForwards}?${q}`),
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
    fetchJsonWithApiStatusLog<GovernanceVaultForwardsMetaJson>("GovernanceVaultForwardsPage.meta", apiUrl(routes.meta))
      .then(({ res, body }) => {
        if (!res.ok) {
          setMetaHttpError(governanceMetaHttpErrorLine(res.status, body, t));
          setMetaContractsLoaded(false);
          setMetaVaultRaw(null);
          setConfiguredChainId(null);
          setScopeMetaChain(false);
          return;
        }
        setMetaHttpError(null);
        const b = body as GovernanceVaultForwardsMetaJson;
        const contracts = b?.chain?.contracts;
        setMetaContractsLoaded(contracts != null && typeof contracts === "object");
        const rv = contracts?.region_vault_address?.trim();
        setMetaVaultRaw(rv && rv.length > 0 ? rv : null);
        const id = resolveConfiguredChainId(b);
        setConfiguredChainId(id);
        setScopeMetaChain(id != null);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("GovernanceVaultForwardsPage meta fetch:", err);
        }
        setMetaHttpError(mapApiReadError(err, t, "governance_requestFailed"));
        setMetaVaultRaw(null);
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
          console.error("GovernanceVaultForwardsPage initial:", e);
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
          console.error("GovernanceVaultForwardsPage loadMore:", e);
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
    metaVaultRaw,
    metaContractsLoaded,
    onLoadMore,
  };
}
