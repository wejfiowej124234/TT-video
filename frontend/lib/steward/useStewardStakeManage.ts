"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMeStewardApplication,
  getMeStewardSeat,
  postStewardFinalizeResign,
  postStewardResignNotice,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { parseStewardApplicationStakeView } from "@/lib/steward/parseStewardApplicationView";
import { parseStewardSeatView, type StewardSeatView } from "@/lib/steward/stewardSeatModel";
import { getRegionStewardStakePoolAddress } from "@/lib/steward/stewardStakeEnv";

export type StewardJurisdictionStakeRow = {
  jurisdiction: string;
  hasStake: boolean | null;
  loadError: boolean;
  releaseRequestedAt?: number;
  releasableAmount?: string | null;
};

export function useStewardStakeManage(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [app, setApp] = useState<ReturnType<typeof parseStewardApplicationStakeView>>(null);
  const [seat, setSeat] = useState<StewardSeatView | null>(null);
  const [rows, setRows] = useState<StewardJurisdictionStakeRow[]>([]);
  const poolConfigured = !!getRegionStewardStakePoolAddress();

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setActionError(null);
    try {
      const [appRaw, seatRaw] = await Promise.all([getMeStewardApplication(), getMeStewardSeat()]);
      const view = parseStewardApplicationStakeView(appRaw);
      setApp(view);
      setSeat(parseStewardSeatView(seatRaw));
      if (!view) {
        setRows([]);
        return;
      }
      setRows(
        view.jurisdictions.map((jid) => ({
          jurisdiction: jid,
          hasStake: null,
          loadError: false,
        })),
      );
    } catch {
      setApp(null);
      setSeat(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateRowStake = useCallback((jurisdiction: string, hasStake: boolean | null, loadError = false) => {
    setRows((prev) => {
      const row = prev.find((item) => item.jurisdiction === jurisdiction);
      if (!row || (row.hasStake === hasStake && row.loadError === loadError)) {
        return prev;
      }
      return prev.map((item) =>
        item.jurisdiction === jurisdiction ? { ...item, hasStake, loadError } : item,
      );
    });
  }, []);

  const submitResignNotice = useCallback(
    async (t: (key: string, vars?: Record<string, string | number>) => string) => {
      setActionLoading(true);
      setActionError(null);
      try {
        await postStewardResignNotice();
        await load();
      } catch (e) {
        setActionError(mapApiReadError(e, t, "stewardSeat_resign_notice_failed"));
      } finally {
        setActionLoading(false);
      }
    },
    [load],
  );

  const finalizeResign = useCallback(
    async (t: (key: string, vars?: Record<string, string | number>) => string) => {
      setActionLoading(true);
      setActionError(null);
      try {
        await postStewardFinalizeResign();
        await load();
      } catch (e) {
        setActionError(mapApiReadError(e, t, "stewardSeat_finalize_resign_failed"));
      } finally {
        setActionLoading(false);
      }
    },
    [load],
  );

  return {
    loading,
    actionLoading,
    actionError,
    app,
    seat,
    rows,
    poolConfigured,
    reload: load,
    submitResignNotice,
    finalizeResign,
    updateRowStake,
  };
}
