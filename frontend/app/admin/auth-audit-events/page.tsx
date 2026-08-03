"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminAuthAuditEventsPageMain } from "./AdminAuthAuditEventsPageMain";
import { useAdminAuthAuditEventsPage } from "./useAdminAuthAuditEventsPage";

function AdminAuthAuditEventsPageInner() {
  const vm = useAdminAuthAuditEventsPage();
  return (
    <>
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.READ} />
      <AdminAuthAuditEventsPageMain {...vm} />
    </>
  );
}

export default function AdminAuthAuditEventsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_auth_audit_events_title">
      <AdminAuthAuditEventsPageInner />
    </AdminSearchParamsSuspense>
  );
}
