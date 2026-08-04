"use client";

import { useMemo, useState } from "react";

import { appendAdminOnboardingQueueListLimit } from "@/lib/admin/adminOnboardingQueueListLimit";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api/routes";

export type AdminProviderApplicationRow = {
  user_id?: string;
  email?: string | null;
  user_role?: string;
  application?: {
    status?: string;
    shop_name?: string;
    legal_name?: string;
    submitted_at?: string;
  };
};

export function useAdminProviderApplicationsPage(statusFilter: string) {
  const [reloadTick, setReloadTick] = useState(0);

  const listUrl = useMemo(() => {
    const q = statusFilter.trim() ? `?status=${encodeURIComponent(statusFilter.trim())}` : "";
    return appendAdminOnboardingQueueListLimit(`${routes.adminProviderApplications}${q}`);
  }, [statusFilter]);

  const { items, loading, refreshing, error, staleWhileError, appliedFilters } =
    useAdminStandardListFetch<AdminProviderApplicationRow>({
      scope: "provider-applications",
      context: "AdminProviderApplicationsPage.load",
      listUrl,
      refreshToken: reloadTick,
    });

  return {
    items,
    loading,
    refreshing,
    error,
    staleWhileError,
    appliedFilters,
    bumpReload: () => setReloadTick((n) => n + 1),
  };
}
