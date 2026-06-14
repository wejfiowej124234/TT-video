"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentHotelTiers, type AdminCatalogHotelTierRow } from "@/lib/apiClient";

export function useAdminContentHotelTiersPage() {
  const [items, setItems] = useState<AdminCatalogHotelTierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentHotelTiers();
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_hotel_tiers_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error };
}
