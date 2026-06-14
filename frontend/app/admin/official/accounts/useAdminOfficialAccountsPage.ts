"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminOfficialAccounts,
  type AdminOfficialAccountRow,
} from "@/lib/apiClient";

export function useAdminOfficialAccountsPage() {
  const [items, setItems] = useState<AdminOfficialAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOfficialAccounts({ limit: 100 });
      setItems(res.items ?? []);
    } catch {
      setError("admin_official_accounts_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
