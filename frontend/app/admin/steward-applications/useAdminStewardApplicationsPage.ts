"use client";

import { useMemo, useState } from "react";

import { appendAdminOnboardingQueueListLimit } from "@/lib/admin/adminOnboardingQueueListLimit";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api/routes";

export type AdminStewardApplicationRow = {
  user_id?: string;
  email?: string | null;
  application?: {
    status?: string;
    jurisdictions?: string[];
    legal_name?: string;
    submitted_at?: string;
  };
};

export function useAdminStewardApplicationsPage(statusFilter: string) {
  const [reloadTick, setReloadTick] = useState(0);

  const listUrl = useMemo(() => {
    const q = statusFilter.trim() ? `?status=${encodeURIComponent(statusFilter.trim())}` : "";
    return appendAdminOnboardingQueueListLimit(`${routes.adminStewardApplications}${q}`);
  }, [statusFilter]);

  const { items, loading, refreshing, error, staleWhileError, appliedFilters } =
    useAdminStandardListFetch<AdminStewardApplicationRow>({
      scope: "steward-applications",
      context: "AdminStewardApplicationsPage.load",
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
