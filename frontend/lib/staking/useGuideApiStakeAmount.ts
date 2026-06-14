"use client";

import { useEffect, useState } from "react";

import { getMeFull } from "@/lib/apiClient";
import { parseGuideStakeAmountFromMe } from "@/lib/guide/guideIdentityStakingNav";

/** ① 本地：链不可读时以 `GET /me` · `guide.stake_amount` 作只读兜底（非链上真值）。 */
export function useGuideApiStakeAmount(enabled: boolean): {
  amount: string | null;
  loading: boolean;
  error: boolean;
} {
  const [amount, setAmount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setAmount(null);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    getMeFull()
      .then((data) => {
        if (cancelled) return;
        setAmount(parseGuideStakeAmountFromMe(data));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { amount, loading, error };
}
