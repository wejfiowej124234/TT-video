"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminApiVersionsPageMain } from "./AdminApiVersionsPageMain";

export default function AdminApiVersionsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_api_versions_title">
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.PLATFORM_READ} />
      <AdminApiVersionsPageMain />
    </AdminSearchParamsSuspense>
  );
}
