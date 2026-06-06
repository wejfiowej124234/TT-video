"use client";

import { AdminConfigPlatformPageShell } from "@/components/admin/AdminConfigPlatformPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminFlagsPageMain } from "./AdminFlagsPageMain";

export default function AdminFlagsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_flags_title">
      <AdminConfigPlatformPageShell currentLabelKey="admin_flags_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.PLATFORM_PUBLISH} />
        <AdminFlagsPageMain />
      </AdminConfigPlatformPageShell>
    </AdminSearchParamsSuspense>
  );
}
