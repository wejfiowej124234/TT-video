"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminLifecyclePageMain } from "./AdminLifecyclePageMain";

export default function AdminLifecyclePage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_lifecycle_title">
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.PLATFORM_READ} />
      <AdminLifecyclePageMain />
    </AdminSearchParamsSuspense>
  );
}
