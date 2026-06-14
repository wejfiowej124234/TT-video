"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentPricing, type AdminCatalogPricingRow } from "@/lib/apiClient";

export function useAdminContentPricingPage() {
  const [items, setItems] = useState<AdminCatalogPricingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await getAdminContentPricing();
        setItems(res.items ?? []);
      } catch {
        setError("admin_content_pricing_load_failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { items, loading, error };
}
