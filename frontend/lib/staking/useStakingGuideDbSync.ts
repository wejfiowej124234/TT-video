"use client";

import { useCallback, useState } from "react";

import type { StakingPoolKind } from "@/components/staking/StakingContractPanel";
import { syncGuideOnChainStakeToApi } from "./stakingGuideDbSync";

/** 链上写成功后触发 API `guides.stake_amount` 对拍（仅 guide 池 · ① best-effort） */
export function useStakingGuideDbSync(pool: StakingPoolKind) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncAfterTx = useCallback(
    async (totalStakeRaw: bigint | undefined, decimals: number | undefined) => {
      if (pool !== "guide") return;
      if (totalStakeRaw === undefined || decimals === undefined) return;
      setSyncing(true);
      setSyncError(null);
      try {
        const result = await syncGuideOnChainStakeToApi(totalStakeRaw, decimals);
        if (!result.ok && result.reason !== "guide_id_missing") {
          setSyncError(result.detail ?? result.reason);
        }
      } finally {
        setSyncing(false);
      }
    },
    [pool],
  );

  return { syncAfterTx, syncing, syncError };
}
