"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminOfficialAccounts,
  getAdminOfficialColdStartCampaigns,
  getAdminOfficialItineraryTemplates,
  type AdminColdStartCampaignRow,
  type AdminOfficialAccountRow,
  type AdminOfficialItineraryTemplateRow,
} from "@/lib/apiClient";

export function useAdminOfficialColdStartPage() {
  const [items, setItems] = useState<AdminColdStartCampaignRow[]>([]);
  const [accounts, setAccounts] = useState<AdminOfficialAccountRow[]>([]);
  const [templates, setTemplates] = useState<AdminOfficialItineraryTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignsRes, accountsRes, templatesRes] = await Promise.all([
        getAdminOfficialColdStartCampaigns({ limit: 100 }),
        getAdminOfficialAccounts({ limit: 100, is_active: true }),
        getAdminOfficialItineraryTemplates({ publish_status: "published", limit: 100 }),
      ]);
      setItems(campaignsRes.items ?? []);
      setAccounts(accountsRes.items ?? []);
      setTemplates(templatesRes.items ?? []);
    } catch {
      setError("admin_official_cold_start_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, accounts, templates, loading, error, reload };
}
