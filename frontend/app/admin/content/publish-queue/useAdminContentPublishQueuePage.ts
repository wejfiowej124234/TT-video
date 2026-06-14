"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentPublishQueue, type AdminCatalogPublishQueueRow } from "@/lib/apiClient";

export function useAdminContentPublishQueuePage() {
  const [items, setItems] = useState<AdminCatalogPublishQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentPublishQueue();
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_publish_queue_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
