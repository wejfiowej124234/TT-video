"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminOrdersPageMain } from "./AdminOrdersPageMain";

export default function AdminOrdersPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_orders_title">
      <AdminOrdersPageMain />
    </AdminSearchParamsSuspense>
  );
}
