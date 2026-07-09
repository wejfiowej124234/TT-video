"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminOfficialPublicOperationsPublishQueue,
  postAdminOfficialPublicOperationsPublish,
  postAdminOfficialPublicOperationsUnpublish,
  type AdminPublicOpsDisplayRow,
} from "@/lib/apiClient";

export type PublicOpsEntityType = "guides" | "orders" | "market_listings" | "community_posts";

export function useAdminOfficialPublicOperationsPublishTab(
  entityType: PublicOpsEntityType,
  displayStatusFilter?: string,
) {
  const [items, setItems] = useState<AdminPublicOpsDisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOfficialPublicOperationsPublishQueue({
        entity_type: entityType,
        display_status: displayStatusFilter,
        limit: 50,
      });
      if (res.status === "ok") {
        setItems(res.items ?? []);
      } else {
        setError("admin_public_operations_publish_load_failed");
      }
    } catch {
      setError("admin_public_operations_publish_load_failed");
    } finally {
      setLoading(false);
    }
  }, [entityType, displayStatusFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function publish(row: AdminPublicOpsDisplayRow) {
    setBusy(true);
    setError(null);
    try {
      const res = await postAdminOfficialPublicOperationsPublish(row.entity_type, row.id);
      if (res.status === "ok") await reload();
      else setError("admin_public_operations_publish_failed");
    } catch {
      setError("admin_public_operations_publish_failed");
    } finally {
      setBusy(false);
    }
  }

  async function unpublish(row: AdminPublicOpsDisplayRow) {
    setBusy(true);
    setError(null);
    try {
      const res = await postAdminOfficialPublicOperationsUnpublish(row.entity_type, row.id);
      if (res.status === "ok") await reload();
      else setError("admin_public_operations_unpublish_failed");
    } catch {
      setError("admin_public_operations_unpublish_failed");
    } finally {
      setBusy(false);
    }
  }

  return { items, loading, error, busy, reload, publish, unpublish };
}
