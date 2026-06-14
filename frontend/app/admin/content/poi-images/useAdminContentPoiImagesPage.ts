"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentPoiImageBatches, type AdminPoiImageBatchRow } from "@/lib/apiClient";

export function useAdminContentPoiImagesPage(status?: string) {
  const [items, setItems] = useState<AdminPoiImageBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentPoiImageBatches(status ? { status } : undefined);
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_poi_images_load_failed");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
