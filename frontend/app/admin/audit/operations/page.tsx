"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminAuditOperationsPageMain } from "./AdminAuditOperationsPageMain";

export default function AdminAuditOperationsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_audit_ops_title">
      <AdminAuditOperationsPageMain />
    </AdminSearchParamsSuspense>
  );
}
