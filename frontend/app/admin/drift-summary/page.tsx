"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import AdminDriftSummaryPageMain from "./AdminDriftSummaryPageMain";
import { useAdminDriftSummaryPage } from "./useAdminDriftSummaryPage";

function AdminDriftSummaryPageInner() {
  const vm = useAdminDriftSummaryPage();
  return <AdminDriftSummaryPageMain {...vm} />;
}

export default function AdminDriftSummaryPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_drift_summary_title">
      <AdminDriftSummaryPageInner />
    </AdminSearchParamsSuspense>
  );
}