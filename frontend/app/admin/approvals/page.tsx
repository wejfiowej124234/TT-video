"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminApprovalsPageMain } from "./AdminApprovalsPageMain";

export default function AdminApprovalsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_approvals_title">
      <AdminApprovalsPageMain />
    </AdminSearchParamsSuspense>
  );
}
