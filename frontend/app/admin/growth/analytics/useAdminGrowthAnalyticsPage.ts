"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminGrowthAnalyticsFunnel,
  getAdminGrowthAnalyticsOverview,
  getAdminGrowthAnalyticsTopReferrers,
  type GrowthAnalyticsFunnel,
  type GrowthAnalyticsOverview,
  type TopReferrerRow,
} from "@/lib/apiClient";

const WINDOW_OPTIONS = [
  { days: 0, labelKey: "admin_growth_analytics_window_all" },
  { days: 7, labelKey: "admin_growth_analytics_window_7d" },
  { days: 30, labelKey: "admin_growth_analytics_window_30d" },
  { days: 90, labelKey: "admin_growth_analytics_window_90d" },
] as const;

export function useAdminGrowthAnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [overview, setOverview] = useState<GrowthAnalyticsOverview | null>(null);
  const [funnel, setFunnel] = useState<GrowthAnalyticsFunnel | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = days > 0 ? { days } : undefined;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, funnelRes, referrersRes] = await Promise.all([
        getAdminGrowthAnalyticsOverview(query),
        getAdminGrowthAnalyticsFunnel(query),
        getAdminGrowthAnalyticsTopReferrers({ ...query, limit: 15 }),
      ]);
      setOverview(overviewRes.summary ?? null);
      setFunnel(funnelRes.funnel ?? null);
      setTopReferrers(referrersRes.items ?? []);
    } catch {
      setError("admin_growth_analytics_load_failed");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    days,
    setDays,
    windowOptions: WINDOW_OPTIONS,
    overview,
    funnel,
    topReferrers,
    loading,
    error,
    reload,
  };
}
