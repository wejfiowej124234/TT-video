"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminOfficialPublicOperationsStats,
  type AdminPublicOperationsStatsRes,
} from "@/lib/apiClient";

export function useAdminOfficialPublicOperationsPage() {
  const [stats, setStats] = useState<AdminPublicOperationsStatsRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOfficialPublicOperationsStats();
      if (res.status === "ok") {
        setStats(res);
        setLastFetchedAt(new Date().toISOString());
      } else {
        setError(res.error ?? "admin_public_operations_stats_failed");
      }
    } catch {
      setError("admin_public_operations_stats_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { stats, loading, error, reload, lastFetchedAt };
}
