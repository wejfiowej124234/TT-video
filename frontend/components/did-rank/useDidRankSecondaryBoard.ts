"use client";

import { useCallback, useEffect, useState } from "react";
import type { Period } from "@/lib/didRankUtils";
import { getDidRankAcquisitions, getDidRankProviders } from "@/lib/apiClient";
import {
  extractDidRankList,
  normalizeDidRankSecondaryRow,
  type DidRankSecondaryRankItem as DidRankSecondaryRow,
} from "@/lib/didRankResponseNormalize";
import { attachDidRankRankDeltas } from "@/lib/didRankRankDelta";
import { useDidRankLivePoll } from "@/lib/useDidRankLivePoll";

export type { DidRankSecondaryRankItem as DidRankSecondaryRow } from "@/lib/didRankResponseNormalize";

export function useDidRankSecondaryBoard(
  board: "provider" | "acquisition",
  period: Period,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const [apiConnected, setApiConnected] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [items, setItems] = useState<DidRankSecondaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(() => enabled);
  const [fetchError, setFetchError] = useState(false);

  const fetchBoard = useCallback(async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const raw =
        board === "provider" ? await getDidRankProviders(period) : await getDidRankAcquisitions(period);
      if (raw && typeof raw === "object") {
        const o = raw as Record<string, unknown>;
        const key = board === "provider" ? "providers" : "acquisitions";
        const rows = extractDidRankList(raw, key)
          .map(normalizeDidRankSecondaryRow)
          .filter((x): x is DidRankSecondaryRow => x != null);
        const withDelta = rows.some((r) => r.rank_delta != null)
          ? rows
          : attachDidRankRankDeltas(rows, `${board}:${period}`);
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
  }, [board, period]);

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
