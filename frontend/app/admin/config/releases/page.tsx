"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminConfigReleasesPageMain } from "./AdminConfigReleasesPageMain";

export default function AdminConfigReleasesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_config_releases_title">
      <AdminConfigReleasesPageMain />
    </AdminSearchParamsSuspense>
  );
}
