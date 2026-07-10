"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentCities, type AdminCatalogCityRow } from "@/lib/apiClient/content/http";

export function useAdminContentCitiesPage() {
  const [items, setItems] = useState<AdminCatalogCityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentCities();
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_cities_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error };
}
