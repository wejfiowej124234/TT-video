import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getGovernanceProposalStatus } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { GovernanceProposalExecStatusEntry } from "@/components/governance/GovernanceProposalExecStatusBadge";
import { getMeta } from "@/lib/apiClient";
import { governorAddressFromMeta } from "@/lib/governanceChainMeta";
import type { GovernanceProposalsPageItem, GovernanceProposalsPageRes } from "./governanceProposalsPageModel";

export function useGovernanceProposalsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<GovernanceProposalsPageItem[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [metaGovernor, setMetaGovernor] = useState<string | null>(null);
  const [chainExecById, setChainExecById] = useState<
    Record<string, GovernanceProposalExecStatusEntry> | undefined
  >(undefined);
  const [chainExecLoading, setChainExecLoading] = useState(false);

  const projectionItemsKey = useMemo(() => {
    if (!items || items.length === 0) return "";
    return items
      .map((p) => (typeof p.id === "string" && p.id.trim() ? p.id.trim() : ""))
      .join("|");
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const headers: Record<string, string> = { "x-request-id": `gov-proposals-${Date.now()}` };
    fetchJsonWithApiStatusLog<GovernanceProposalsPageRes>("governanceProposals", apiUrl(routes.governanceProposals), {
      headers,
    })
      .then(({ res, body: j }) => {
        if (!res.ok) throw new Error(String(res.status));
        if (j == null || typeof j !== "object") throw new Error("invalid");
        const o = j as GovernanceProposalsPageRes;
        if (o.status !== "ok") throw new Error(String(o.status ?? "bad_status"));
        if (!Array.isArray(o.items)) throw new Error("invalid_items");
        return {
          items: o.items as GovernanceProposalsPageItem[],
          note: typeof o.note === "string" ? o.note : null,
          data_source: typeof o.data_source === "string" ? o.data_source : null,
          chain_id: typeof o.chain_id === "number" && Number.isFinite(o.chain_id) ? o.chain_id : null,
        };
      })
      .then(({ items: next, note: n, data_source: ds, chain_id: cid }) => {
        if (cancelled) return;
        setItems(next);
        setNote(n);
        setDataSource(ds);
        setChainId(cid);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("GovernanceProposalsPage fetch:", err);
        }
        setItems(null);
        setNote(null);
        setDataSource(null);
        setChainId(null);
        setError(mapApiReadError(err, t, "governance_proposals_loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, retryTick]);

  useEffect(() => {
    if (dataSource !== "governance_proposals_projection") {
      setMetaGovernor(null);
      return undefined;
    }
    let cancelled = false;
    getMeta()
      .then((m) => {
        if (cancelled) return;
        setMetaGovernor(governorAddressFromMeta(m));
      })
      .catch(() => {
        if (!cancelled) setMetaGovernor(null);
      });
    return () => {
      cancelled = true;
    };
  }, [dataSource, retryTick]);

  useEffect(() => {
    if (dataSource !== "governance_proposals_projection" || items === null || items.length === 0) {
      setChainExecById(undefined);
      setChainExecLoading(false);
      return undefined;
    }
    const ids = items
      .map((p) => p.id)
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    if (ids.length === 0) {
      setChainExecById(undefined);
      setChainExecLoading(false);
      return undefined;
    }
    let cancelled = false;
    setChainExecLoading(true);
    void (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          const row = await getGovernanceProposalStatus(id);
          if (row) {
            return [
              id,
              {
                state: "ok" as const,
                status: row.status,
                is_chain_ssot: row.is_chain_ssot,
                ...(row.data_source ? { data_source: row.data_source } : {}),
                ...(row.note ? { note: row.note } : {}),
              },
            ] as const;
          }
          return [id, { state: "error" } as const] as const;
        }),
      );
      if (cancelled) return;
      const next: Record<string, GovernanceProposalExecStatusEntry> = {};
      for (const [id, e] of entries) next[id] = e;
      setChainExecById(next);
      setChainExecLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [dataSource, items, projectionItemsKey, retryTick]);

  const emptySuccess = !loading && !error && items !== null && items.length === 0;
  const showOnChainPanel = !loading && !error && dataSource === "governance_proposals_projection";

  return {
    t,
    items,
    note,
    loading,
    error,
    setRetryTick,
    dataSource,
    chainId,
    metaGovernor,
    chainExecById,
    chainExecLoading,
    emptySuccess,
    showOnChainPanel,
  };
}
