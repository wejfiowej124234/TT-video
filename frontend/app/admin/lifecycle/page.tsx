"use client";

import { AdminConfigPlatformPageShell } from "@/components/admin/AdminConfigPlatformPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminLifecyclePageMain } from "./AdminLifecyclePageMain";

export default function AdminLifecyclePage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_lifecycle_title">
      <AdminConfigPlatformPageShell currentLabelKey="admin_lifecycle_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.PLATFORM_READ} />
        <AdminLifecyclePageMain />
      </AdminConfigPlatformPageShell>
    </AdminSearchParamsSuspense>
  );
}
