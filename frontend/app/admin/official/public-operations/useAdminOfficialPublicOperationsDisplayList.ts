"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminOfficialPublicOperationsPublishQueue,
  type AdminPublicOpsDisplayRow,
} from "@/lib/apiClient";

export type PublicOpsEntityType = "guides" | "orders" | "market_listings" | "community_posts";

export function useAdminOfficialPublicOperationsDisplayList(
  entityType: PublicOpsEntityType,
  options?: { displayStatus?: string; featuredOnly?: boolean; limit?: number },
) {
  const [items, setItems] = useState<AdminPublicOpsDisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOfficialPublicOperationsPublishQueue({
        entity_type: entityType,
        display_status: options?.displayStatus,
        featured_only: options?.featuredOnly,
        limit: options?.limit ?? 50,
      });
      if (res.status === "ok") {
        setItems(res.items ?? []);
      } else {
        setError("admin_public_operations_display_load_failed");
      }
    } catch {
      setError("admin_public_operations_display_load_failed");
    } finally {
      setLoading(false);
    }
  }, [entityType, options?.displayStatus, options?.featuredOnly, options?.limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
