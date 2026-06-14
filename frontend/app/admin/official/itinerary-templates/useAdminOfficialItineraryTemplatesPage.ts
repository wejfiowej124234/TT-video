"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminOfficialAccounts,
  getAdminOfficialItineraryTemplates,
  type AdminOfficialAccountRow,
  type AdminOfficialItineraryTemplateRow,
} from "@/lib/apiClient";

export function useAdminOfficialItineraryTemplatesPage() {
  const [items, setItems] = useState<AdminOfficialItineraryTemplateRow[]>([]);
  const [accounts, setAccounts] = useState<AdminOfficialAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [templatesRes, accountsRes] = await Promise.all([
        getAdminOfficialItineraryTemplates({ limit: 100 }),
        getAdminOfficialAccounts({ limit: 100, is_active: true }),
      ]);
      setItems(templatesRes.items ?? []);
      setAccounts(accountsRes.items ?? []);
    } catch {
      setError("admin_official_templates_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, accounts, loading, error, reload };
}
