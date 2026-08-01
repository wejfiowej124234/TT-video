"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Period } from "@/lib/didRankUtils";
import { getDidRankItineraries } from "@/lib/apiClient";
import {
  extractDidRankList,
  normalizeDidRankItineraryRow,
} from "@/lib/didRankResponseNormalize";
import type { ItineraryRankItem } from "@/lib/didRankTypes";
import { attachDidRankRankDeltas } from "@/lib/didRankRankDelta";
import { useDidRankLivePoll } from "@/lib/useDidRankLivePoll";

export function useDidRankItineraryBoard(
  period: Period,
  options?: { enabled?: boolean; initialItems?: ItineraryRankItem[] | null },
) {
  const enabled = options?.enabled ?? true;
  const initialItems = options?.initialItems ?? null;
  const [apiConnected, setApiConnected] = useState(() => Boolean(initialItems && initialItems.length > 0));
  const [note, setNote] = useState<string | null>(null);
  const [items, setItems] = useState<ItineraryRankItem[]>(() => initialItems ?? []);
  const [isLoading, setIsLoading] = useState(() => enabled && !(initialItems && initialItems.length > 0));
  const [fetchError, setFetchError] = useState(false);
  const skipInitialFetchRef = useRef(Boolean(initialItems && initialItems.length > 0));

  const fetchBoard = useCallback(async () => {
    const dash = "—";
    setIsLoading(true);
    setFetchError(false);
    try {
      const raw = await getDidRankItineraries(period);
      if (raw && typeof raw === "object") {
        const o = raw as Record<string, unknown>;
        const rows = extractDidRankList(raw, "itineraries")
          .map((x) => normalizeDidRankItineraryRow(x, dash))
          .filter((x): x is ItineraryRankItem => x != null);
        const withDelta = rows.some((r) => r.rank_delta != null)
          ? rows
          : attachDidRankRankDeltas(rows, `itinerary:${period}`);
        setApiConnected(true);
        setNote(typeof o.note === "string" ? o.note : null);
        setItems(withDelta);
        return;
      }
      setApiConnected(false);
      setNote(null);
      setItems([]);
    } catch {
      setApiConnected(false);
      setNote(null);
      setItems([]);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      setIsLoading(false);
      return;
    }
    void fetchBoard();
  }, [enabled, fetchBoard]);

  const livePollActive = useDidRankLivePoll(
    () => {
      void fetchBoard();
    },
    enabled && apiConnected && !isLoading,
  );

  return { apiConnected, note, items, isLoading, livePollActive, fetchError, refresh: fetchBoard };
}
