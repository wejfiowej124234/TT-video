"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentTransportRegionRules, type AdminCatalogTransportRuleRow } from "@/lib/apiClient/content/http";

export function useAdminContentTransportRulesPage() {
  const [items, setItems] = useState<AdminCatalogTransportRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentTransportRegionRules();
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_transport_rules_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error };
}
