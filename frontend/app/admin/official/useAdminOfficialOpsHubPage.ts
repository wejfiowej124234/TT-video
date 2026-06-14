"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminOfficialAccounts,
  getAdminOfficialColdStartCampaigns,
  getAdminOfficialGuides,
  getAdminOfficialItineraryTemplates,
} from "@/lib/apiClient";

export type OfficialOpsHubStats = {
  accounts: number;
  guides: number;
  templates: number;
  campaigns: number;
  pendingReview: number;
};

function countPendingReview(items: { metadata?: Record<string, unknown>; publish_status?: string }[]): number {
  return items.filter((row) => {
    const review = row.metadata?.review_status;
    if (typeof review === "string" && review !== "approved" && review !== "published") return true;
    const ps = row.publish_status;
    return ps === "draft" || ps === "pending_review";
  }).length;
}

export function useAdminOfficialOpsHubPage() {
  const [stats, setStats] = useState<OfficialOpsHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accounts, guides, templates, campaigns] = await Promise.all([
        getAdminOfficialAccounts({ limit: 100 }),
        getAdminOfficialGuides({ limit: 100 }),
        getAdminOfficialItineraryTemplates({ limit: 100 }),
        getAdminOfficialColdStartCampaigns({ limit: 100 }),
      ]);
      const accountItems = accounts.items ?? [];
      const guideItems = guides.items ?? [];
      const templateItems = templates.items ?? [];
      const campaignItems = campaigns.items ?? [];
      setStats({
        accounts: accountItems.length,
        guides: guideItems.length,
        templates: templateItems.length,
        campaigns: campaignItems.length,
        pendingReview:
          countPendingReview(accountItems) +
          countPendingReview(guideItems) +
          countPendingReview(templateItems),
      });
    } catch {
      setError("admin_official_hub_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { stats, loading, error, reload };
}
