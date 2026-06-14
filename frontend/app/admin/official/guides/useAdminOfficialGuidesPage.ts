"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminOfficialAccounts,
  getAdminOfficialGuides,
  type AdminOfficialAccountRow,
  type AdminOfficialGuideRow,
} from "@/lib/apiClient";

export function useAdminOfficialGuidesPage() {
  const [items, setItems] = useState<AdminOfficialGuideRow[]>([]);
  const [accounts, setAccounts] = useState<AdminOfficialAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [guidesRes, accountsRes] = await Promise.all([
        getAdminOfficialGuides({ limit: 100 }),
        getAdminOfficialAccounts({ limit: 100, is_active: true }),
      ]);
      setItems(guidesRes.items ?? []);
      setAccounts(accountsRes.items ?? []);
    } catch {
      setError("admin_official_guides_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, accounts, loading, error, reload };
}
