"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminDisputesPageMain } from "./AdminDisputesPageMain";

export default function AdminDisputesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_disputes_title">
      <AdminDisputesPageMain />
    </AdminSearchParamsSuspense>
  );
}
