"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminConfigReleaseDetailPageMain } from "./AdminConfigReleaseDetailPageMain";

export default function AdminConfigReleaseDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_config_release_detail_title">
      <AdminConfigReleaseDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
