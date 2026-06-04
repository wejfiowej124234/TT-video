"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminOrderDetailPageMain } from "./AdminOrderDetailPageMain";

export default function AdminOrderDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_order_detail_title">
      <AdminOrderDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
