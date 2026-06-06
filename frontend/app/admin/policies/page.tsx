"use client";

import { AdminConfigPlatformPageShell } from "@/components/admin/AdminConfigPlatformPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminPoliciesPageMain } from "./AdminPoliciesPageMain";

export default function AdminPoliciesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_policies_title">
      <AdminConfigPlatformPageShell currentLabelKey="admin_policies_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.PLATFORM_PUBLISH} />
        <AdminPoliciesPageMain />
      </AdminConfigPlatformPageShell>
    </AdminSearchParamsSuspense>
  );
}
