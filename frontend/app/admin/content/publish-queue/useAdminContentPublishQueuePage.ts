"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentPublishQueue, postAdminCatalogEntityWorkflow, type AdminCatalogPublishQueueRow } from "@/lib/apiClient";

export function useAdminContentPublishQueuePage() {
  const [items, setItems] = useState<AdminCatalogPublishQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function publishRow(row: AdminCatalogPublishQueueRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminCatalogEntityWorkflow(row.entity_type, row.entity_id, "publish", { version: row.version });
      await reload();
    } catch {
      setError("admin_content_workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  return { items, loading, error, busy, reload, publishRow };
}
