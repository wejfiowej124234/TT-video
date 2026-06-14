"use client";

import { useMemo, useState } from "react";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api/routes";

export type AdminGuideApplicationRow = {
  user_id?: string;
  email?: string | null;
  user_role?: string;
  application?: {
    status?: string;
    city?: string;
    country_code?: string;
    submitted_at?: string;
  };
};

export function useAdminGuideApplicationsPage(statusFilter: string) {
  const [reloadTick, setReloadTick] = useState(0);

  const listUrl = useMemo(() => {
    const q = statusFilter.trim() ? `?status=${encodeURIComponent(statusFilter.trim())}` : "";
    return `${routes.adminGuideApplications}${q}`;
  }, [statusFilter]);

  const { items, loading, refreshing, error, staleWhileError } =
    useAdminStandardListFetch<AdminGuideApplicationRow>({
      scope: "guide-applications",
      context: "AdminGuideApplicationsPage.load",
      listUrl,
      refreshToken: reloadTick,
    });

  return {
    items,
    loading,
    refreshing,
    error,
    staleWhileError,
    bumpReload: () => setReloadTick((n) => n + 1),
  };
}
