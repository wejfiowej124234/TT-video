"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminComplianceRequestsPageMain } from "./AdminComplianceRequestsPageMain";

export default function AdminComplianceRequestsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_compliance_requests_title">
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.READ} />
      <AdminComplianceRequestsPageMain />
    </AdminSearchParamsSuspense>
  );
}
