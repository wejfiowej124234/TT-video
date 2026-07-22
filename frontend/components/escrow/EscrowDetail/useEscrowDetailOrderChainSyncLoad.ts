"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrder, getOrderChainSyncStatus, isComplianceError } from "@/lib/apiClient";
import { clearEscrowOrderPrefetch, consumeEscrowOrderPrefetch } from "@/lib/orderEscrowPrefetch";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapEscrowForbiddenError } from "@/lib/orderParticipantHint";
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
  const router = useRouter();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryBlock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainSync, setChainSync] = useState<OrderChainSyncState | null>(null);

  const applyOrderGetFailure = useCallback(
    (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "login_required") {
        clearEscrowOrderPrefetch(escrowId);
        setOrder(null);
        setItinerary(null);
        setError(t("order_error_login_required"));
        if (typeof window !== "undefined") {
          const returnUrl = `/escrow/${encodeURIComponent(escrowId)}`;
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        }
        return;
      }
      if (isComplianceError(err)) {
        setError(msg || t("escrow_loadFailed"));
        return;
      }
      if (/403|forbidden|权限|暂无权限/i.test(msg)) {
        clearEscrowOrderPrefetch(escrowId);
        setOrder(null);
        setItinerary(null);
        setError(mapEscrowForbiddenError(err, t));
        return;
      }
      setError(mapApiReadError(err, t, "escrow_loadFailed"));
    },
    [escrowId, router, t],
  );

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
        applyOrderGetFailure(err);
      });
    return () => {
      cancelled = true;
    };
  }, [escrowId, t, applyOrderGetFailure]);

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
        applyOrderGetFailure(err);
      });
  }, [escrowId, fetchChainSync, applyOrderGetFailure]);

  return { order, itinerary, error, chainSync, refreshOrder };
}
