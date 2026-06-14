"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentCountries,
  getAdminContentLandingAmbient,
  type AdminCatalogCountryRow,
  type AdminCountryLandingAmbientRow,
} from "@/lib/apiClient";

export type LandingAmbientListRow = AdminCatalogCountryRow & {
  landing?: AdminCountryLandingAmbientRow | null;
};

export function useAdminContentLandingAmbientPage() {
  const [items, setItems] = useState<LandingAmbientListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const countries = (await getAdminContentCountries()).items ?? [];
      const rows = await Promise.all(
        countries.map(async (c) => {
          try {
            const res = await getAdminContentLandingAmbient(c.id);
            return { ...c, landing: res.item ?? null };
          } catch {
            return { ...c, landing: null };
          }
        }),
      );
      setItems(rows);
    } catch {
      setError("admin_content_landing_ambient_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error };
}
