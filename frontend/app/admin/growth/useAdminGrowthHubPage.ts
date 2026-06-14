"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminGrowthAnalyticsOverview,
  type GrowthAnalyticsOverview,
} from "@/lib/apiClient";

/** Read-only 30d KPI snapshot for Growth hub console (101 S2 · UX-P2-01). */
export function useAdminGrowthHubPage() {
  const [overview, setOverview] = useState<GrowthAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminGrowthAnalyticsOverview({ days: 30 });
      setOverview(res.summary ?? null);
    } catch {
      setError("admin_growth_hub_kpi_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { overview, loading, error, reload };
}
