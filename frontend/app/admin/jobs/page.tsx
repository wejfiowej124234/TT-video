"use client";

import { AdminConfigPlatformPageShell } from "@/components/admin/AdminConfigPlatformPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminJobsPageMain } from "./AdminJobsPageMain";

export default function AdminJobsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_jobs_title">
      <AdminConfigPlatformPageShell currentLabelKey="admin_jobs_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.PLATFORM_READ} />
        <AdminJobsPageMain />
      </AdminConfigPlatformPageShell>
    </AdminSearchParamsSuspense>
  );
}
