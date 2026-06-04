"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminAuthAuditEventsPageMain } from "./AdminAuthAuditEventsPageMain";
import { useAdminAuthAuditEventsPage } from "./useAdminAuthAuditEventsPage";

function AdminAuthAuditEventsPageInner() {
  const vm = useAdminAuthAuditEventsPage();
  return <AdminAuthAuditEventsPageMain {...vm} />;
}

export default function AdminAuthAuditEventsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_auth_audit_events_title">
      <AdminAuthAuditEventsPageInner />
    </AdminSearchParamsSuspense>
  );
}
