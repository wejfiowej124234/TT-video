"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrder, getOrderChainSyncStatus, isComplianceError } from "@/lib/apiClient";
import { consumeEscrowOrderPrefetch } from "@/lib/orderEscrowPrefetch";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { OrderRow, OrderResponse, ItineraryBlock, OrderChainSyncState } from "./types";
import { parseOrderChainSyncResponse } from "./types";
import { itineraryOrPlaceholderForPreEscrow } from "./escrowDetailHookModel";

export function useEscrowDetailOrderChainSyncLoad(
  escrowId: string,
  t: (key: string) => string,
): {
  order: OrderRow | null;
  itinerary: ItineraryBlock | null;
  error: string | null;
  chainSync: OrderChainSyncState | null;
  refreshOrder: () => void;
} {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryBlock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainSync, setChainSync] = useState<OrderChainSyncState | null>(null);

  const fetchChainSync = useCallback(() => {
    getOrderChainSyncStatus(escrowId)
      .then((raw) => {
        setChainSync(parseOrderChainSyncResponse(raw));
      })
      .catch(() => {
        setChainSync(null);
      });
  }, [escrowId]);

  useEffect(() => {
    fetchChainSync();
  }, [fetchChainSync]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const pref = consumeEscrowOrderPrefetch(escrowId);
    if (pref) {
      setOrder(pref.order);
      setItinerary(itineraryOrPlaceholderForPreEscrow(pref.order as OrderRow, pref.itinerary));
    }
    getOrder(escrowId)
      .then((data: unknown) => {
        if (cancelled) return;
        setError(null);
        const res = data as OrderResponse;
        const o = res?.order ?? (data as OrderRow);
        const normalized = o?.id ? o : { ...o, id: escrowId };
        setOrder(normalized);
        setItinerary(
          itineraryOrPlaceholderForPreEscrow(normalized as OrderRow, res?.itinerary ?? null),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("useEscrowDetailOrderChainSyncLoad getOrder:", err);
        }
        const msg = err instanceof Error ? err.message : "";
        if (isComplianceError(err)) setError(msg || t("escrow_loadFailed"));
        else if (/403|forbidden|权限|暂无权限/i.test(msg)) setError(t("escrow_403_message"));
        else setError(mapApiReadError(err, t, "escrow_loadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [escrowId, t]);

  const refreshOrder = useCallback(() => {
    getOrder(escrowId)
      .then((data: unknown) => {
        setError(null);
        const res = data as OrderResponse;
        const o = res?.order ?? (data as OrderRow);
        if (o?.id) setOrder(o);
        setItinerary(itineraryOrPlaceholderForPreEscrow(o as OrderRow | undefined, res?.itinerary ?? null));
        fetchChainSync();
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useEscrowDetailOrderChainSyncLoad refreshOrder getOrder:", err);
        }
        const msg = err instanceof Error ? err.message : "";
        if (isComplianceError(err)) setError(msg || t("escrow_loadFailed"));
        else if (/403|forbidden|权限|暂无权限/i.test(msg)) setError(t("escrow_403_message"));
        else setError(mapApiReadError(err, t, "escrow_loadFailed"));
      });
  }, [escrowId, t, fetchChainSync]);

  return { order, itinerary, error, chainSync, refreshOrder };
}
