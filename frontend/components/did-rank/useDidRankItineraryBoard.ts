"use client";

import { useCallback, useEffect, useState } from "react";
import type { Period } from "@/lib/didRankUtils";
import { getDidRankItineraries } from "@/lib/apiClient";
import {
  extractDidRankList,
  normalizeDidRankItineraryRow,
} from "@/lib/didRankResponseNormalize";
import type { ItineraryRankItem } from "@/lib/didRankTypes";
import { attachDidRankRankDeltas } from "@/lib/didRankRankDelta";
import { useDidRankLivePoll } from "@/lib/useDidRankLivePoll";

export function useDidRankItineraryBoard(period: Period, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [apiConnected, setApiConnected] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [items, setItems] = useState<ItineraryRankItem[]>([]);
  const [isLoading, setIsLoading] = useState(() => enabled);
  const [fetchError, setFetchError] = useState(false);

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
