"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentRevisionDetails,
  type AdminCatalogRevisionDetailRow,
} from "@/lib/apiClient";

export function useAdminContentRevisionsPage(entityType?: string) {
  const [items, setItems] = useState<AdminCatalogRevisionDetailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentRevisionDetails(
        entityType ? { entity_type: entityType, limit: 100 } : { limit: 100 },
      );
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_revisions_load_failed");
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error };
}
