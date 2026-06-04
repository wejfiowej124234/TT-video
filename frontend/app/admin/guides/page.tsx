"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminGuidesPageMain } from "./AdminGuidesPageMain";

export default function AdminGuidesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_guides_title">
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.USERS_READ} />
      <AdminGuidesPageMain />
    </AdminSearchParamsSuspense>
  );
}
