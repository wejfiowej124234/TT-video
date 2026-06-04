"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminDisputeDetailPageMain } from "./AdminDisputeDetailPageMain";

export default function AdminDisputeDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_dispute_detail_title">
      <AdminDisputeDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
