"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { ReconcileReportsPageMain } from "./ReconcileReportsPageMain";

export default function AdminIndexerReconcileReportsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_indexer_reconcile_reports_title">
      <ReconcileReportsPageMain />
    </AdminSearchParamsSuspense>
  );
}
