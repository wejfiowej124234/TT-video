"use client";

import { useCallback, useEffect, useState } from "react";
import { getMeStewardApplication, getStewardStakeStatus } from "@/lib/apiClient";
import { parseStewardApplicationStakeView } from "@/lib/steward/parseStewardApplicationView";
import { stakeJurisdictionCountryCode } from "@/lib/steward/jurisdictionBytes2";
import { getRegionStewardStakePoolAddress } from "@/lib/steward/stewardStakeEnv";

export type StewardJurisdictionStakeRow = {
  jurisdiction: string;
  hasStake: boolean | null;
  loadError: boolean;
};

export function useStewardWorkbenchStake(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState<ReturnType<typeof parseStewardApplicationStakeView>>(null);
  const [rows, setRows] = useState<StewardJurisdictionStakeRow[]>([]);
  const poolConfigured = !!getRegionStewardStakePoolAddress();

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const raw = await getMeStewardApplication();
      const view = parseStewardApplicationStakeView(raw);
      setApp(view);
      if (!view) {
        setRows([]);
        return;
      }
      const next: StewardJurisdictionStakeRow[] = [];
      for (const jid of view.jurisdictions) {
        if (!poolConfigured) {
          next.push({ jurisdiction: jid, hasStake: null, loadError: false });
          continue;
        }
        const stakeJid = stakeJurisdictionCountryCode(jid);
        if (!stakeJid) {
          next.push({ jurisdiction: jid, hasStake: null, loadError: true });
          continue;
        }
        try {
          const st = await getStewardStakeStatus(stakeJid, view.walletAddress);
          if (!st) {
            next.push({ jurisdiction: jid, hasStake: null, loadError: false });
            continue;
          }
          next.push({
            jurisdiction: jid,
            hasStake: st.has_jurisdiction_stake === true,
            loadError: false,
          });
        } catch {
          next.push({ jurisdiction: jid, hasStake: null, loadError: true });
        }
      }
      setRows(next);
    } catch {
      setApp(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, poolConfigured]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, app, rows, poolConfigured, reload: load };
}
