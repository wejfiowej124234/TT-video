"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminAuditLogDetailPageMain } from "./AdminAuditLogDetailPageMain";

export default function AdminAuditLogDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_audit_detail_title">
      <AdminAuditLogDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
