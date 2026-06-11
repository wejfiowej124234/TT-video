"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDidRankPrizePool } from "@/lib/apiClient/didRankPrizePool";
import { resolveDidRankPrizePoolAmount } from "@/lib/didRankPrizePool";
import type { DidRankPageInitialSnapshot } from "@/lib/did-rank/didRankPageInitialData";

export function useDidRankPrizePool(options?: {
  initialPrizePool?: DidRankPageInitialSnapshot["prizePool"];
}) {
  const initialPrizePool = options?.initialPrizePool ?? null;
  const deferInitialRefreshRef = useRef(Boolean(initialPrizePool));
  const fallback = resolveDidRankPrizePoolAmount();
  const [amount, setAmount] = useState(() => initialPrizePool?.amount ?? fallback.amount);
  const [illustrative, setIllustrative] = useState(
    () => initialPrizePool?.illustrative ?? fallback.illustrative,
  );
  const [apiConnected, setApiConnected] = useState(() => initialPrizePool?.apiConnected ?? false);
  const [note, setNote] = useState<string | null>(() => initialPrizePool?.note ?? null);
  const [source, setSource] = useState<string | undefined>(() => initialPrizePool?.source);

  const refresh = useCallback(async () => {
    try {
      const res = await getDidRankPrizePool();
      if (res) {
        setAmount(res.monthly_amount);
        setIllustrative(res.illustrative);
        setApiConnected(true);
        setNote(res.note ?? null);
        setSource(res.source);
        return;
      }
    } catch {
      /* use fallback */
    }
    const fb = resolveDidRankPrizePoolAmount();
    setAmount(fb.amount);
    setIllustrative(fb.illustrative);
    setApiConnected(false);
    setNote(null);
    setSource(undefined);
  }, []);

  useEffect(() => {
    if (deferInitialRefreshRef.current) {
      deferInitialRefreshRef.current = false;
      const run = () => {
        void refresh();
      };
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(run, { timeout: 2500 });
        return () => window.cancelIdleCallback(id);
      }
      const timer = globalThis.setTimeout(run, 800);
      return () => globalThis.clearTimeout(timer);
    }
    void refresh();
  }, [refresh]);

  return { amount, illustrative, apiConnected, note, source, refresh };
}
