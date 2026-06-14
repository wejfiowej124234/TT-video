"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminEarlyBirdReconcile,
  getAdminEarlyBirdStages,
  patchAdminEarlyBirdStage,
  type EarlyBirdReconcileSummary,
  type EarlyBirdStageRow,
  type EarlyBirdStageStats,
} from "@/lib/apiClient";

export function useAdminEarlyBirdPage() {
  const [stages, setStages] = useState<EarlyBirdStageRow[]>([]);
  const [userCounts, setUserCounts] = useState<EarlyBirdStageStats[]>([]);
  const [summary, setSummary] = useState<EarlyBirdReconcileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, recon] = await Promise.all([
        getAdminEarlyBirdStages(),
        getAdminEarlyBirdReconcile(),
      ]);
      setStages(list.items ?? []);
      setUserCounts(list.user_counts_by_stage ?? []);
      setSummary(recon.summary ?? null);
    } catch {
      setError("admin_growth_early_bird_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function toggleActive(row: EarlyBirdStageRow) {
    setBusy(true);
    setError(null);
    try {
      await patchAdminEarlyBirdStage(row.stage_number, { is_active: !row.is_active });
      await reload();
    } catch {
      setError("admin_growth_early_bird_patch_failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveMultiplier(row: EarlyBirdStageRow, multiplier: number) {
    setBusy(true);
    setError(null);
    try {
      await patchAdminEarlyBirdStage(row.stage_number, { multiplier });
      await reload();
    } catch {
      setError("admin_growth_early_bird_patch_failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    stages,
    userCounts,
    summary,
    loading,
    error,
    busy,
    reload,
    toggleActive,
    saveMultiplier,
  };
}
