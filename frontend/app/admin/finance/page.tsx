"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import AdminFinancePageMain from "./AdminFinancePageMain";

export default function AdminFinancePage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_finance_title">
      <AdminFinancePageMain />
    </AdminSearchParamsSuspense>
  );
}
