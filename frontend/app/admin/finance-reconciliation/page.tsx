"use client";

import { AdminFinanceReconciliationPageMain } from "./AdminFinanceReconciliationPageMain";
import { useAdminFinanceReconciliationPage } from "./useAdminFinanceReconciliationPage";

export default function AdminFinanceReconciliationPage() {
  const vm = useAdminFinanceReconciliationPage();
  return <AdminFinanceReconciliationPageMain {...vm} />;
}
