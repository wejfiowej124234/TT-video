"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminApprovalDetailPageMain } from "./AdminApprovalDetailPageMain";

export default function AdminApprovalDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_approval_detail_title">
      <AdminApprovalDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
