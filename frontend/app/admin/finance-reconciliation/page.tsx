"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminFinanceReconciliationPageMain } from "./AdminFinanceReconciliationPageMain";
import { useAdminFinanceReconciliationPage } from "./useAdminFinanceReconciliationPage";

function AdminFinanceReconciliationPageInner() {
  const vm = useAdminFinanceReconciliationPage();
  return <AdminFinanceReconciliationPageMain {...vm} />;
}

export default function AdminFinanceReconciliationPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_finance_reconciliation_title">
      <AdminFinanceReconciliationPageInner />
    </AdminSearchParamsSuspense>
  );
}
