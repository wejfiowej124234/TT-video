"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminGrowthKolCenter,
  getAdminGrowthKolCenterDetail,
  type KolContributionDetail,
  type KolContributionRow,
} from "@/lib/apiClient";

const WINDOW_OPTIONS = [
  { days: 0, labelKey: "admin_growth_analytics_window_all" },
  { days: 7, labelKey: "admin_growth_analytics_window_7d" },
  { days: 30, labelKey: "admin_growth_analytics_window_30d" },
  { days: 90, labelKey: "admin_growth_analytics_window_90d" },
] as const;

export function useAdminKolCenterPage() {
  const [days, setDays] = useState<number>(30);
  const [items, setItems] = useState<KolContributionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<KolContributionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = days > 0 ? { days } : undefined;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminGrowthKolCenter({ ...query, limit: 50 });
      setItems(res.items ?? []);
    } catch {
      setError("admin_growth_kol_load_failed");
    } finally {
      setLoading(false);
    }
  }, [days]);

  const loadDetail = useCallback(
    async (codeId: string) => {
      setSelectedId(codeId);
      setDetailLoading(true);
      setError(null);
      try {
        const res = await getAdminGrowthKolCenterDetail(codeId, { ...query, limit: 20 });
        setDetail(res.detail ?? null);
      } catch {
        setError("admin_growth_kol_detail_failed");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [days],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    days,
    setDays,
    windowOptions: WINDOW_OPTIONS,
    items,
    selectedId,
    detail,
    loading,
    detailLoading,
    error,
    reload,
    loadDetail,
  };
}
