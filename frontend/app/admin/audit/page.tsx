"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminAuditPageMain } from "./AdminAuditPageMain";
import { useAdminAuditPage } from "./useAdminAuditPage";

function AdminAuditPageInner() {
  const vm = useAdminAuditPage();
  return <AdminAuditPageMain {...vm} />;
}

export default function AdminAuditPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_audit_list_title">
      <AdminAuditPageInner />
    </AdminSearchParamsSuspense>
  );
}
