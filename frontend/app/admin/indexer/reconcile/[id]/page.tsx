"use client";



import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";



import { AdminIndexerReconcileReportPageMain } from "./AdminIndexerReconcileReportPageMain";



export default function AdminIndexerReconcileReportPage() {

  return (

    <AdminSearchParamsSuspense ariaLabelKey="admin_indexer_reconcile_title">

      <AdminIndexerReconcileReportPageMain />

    </AdminSearchParamsSuspense>

  );

}

