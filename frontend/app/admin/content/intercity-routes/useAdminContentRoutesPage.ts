"use client";

import { useEffect, useState } from "react";

import { getAdminContentIntercityRoutes, type AdminCatalogRouteRow } from "@/lib/apiClient";

export function useAdminContentRoutesPage() {
  const [items, setItems] = useState<AdminCatalogRouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await getAdminContentIntercityRoutes();
        setItems(res.items ?? []);
      } catch {
        setError("admin_content_routes_load_failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { items, loading, error };
}
