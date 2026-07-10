"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentPois, type AdminCatalogPoiRow } from "@/lib/apiClient/content/http";

export function useAdminContentPoisPage(poiType?: string) {
  const [items, setItems] = useState<AdminCatalogPoiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentPois({ poi_type: poiType });
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_pois_load_failed");
    } finally {
      setLoading(false);
    }
  }, [poiType]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error };
}
