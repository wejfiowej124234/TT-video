"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminCountryMarketLaunches, type CountryMarketLaunchRow } from "@/lib/apiClient";

export function useAdminCountryMarketPage() {
  const [items, setItems] = useState<CountryMarketLaunchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCountryMarketLaunches({ limit: 50 });
      setItems(res.items ?? []);
    } catch {
      setError("admin_country_market_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
