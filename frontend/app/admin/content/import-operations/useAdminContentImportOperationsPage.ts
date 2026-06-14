"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentImportHistory,
  getAdminContentRollbackHistory,
  type AdminCatalogImportBatchRow,
  type AdminCatalogRevisionDetailRow,
} from "@/lib/apiClient";

export function useAdminContentImportOperationsPage() {
  const [imports, setImports] = useState<AdminCatalogImportBatchRow[]>([]);
  const [rollbacks, setRollbacks] = useState<AdminCatalogRevisionDetailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [importRes, rollbackRes] = await Promise.all([
        getAdminContentImportHistory({ limit: 50 }),
        getAdminContentRollbackHistory({ limit: 50 }),
      ]);
      setImports(importRes.items ?? []);
      setRollbacks(rollbackRes.items ?? []);
    } catch {
      setError("admin_content_import_ops_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { imports, rollbacks, loading, error, reload };
}
