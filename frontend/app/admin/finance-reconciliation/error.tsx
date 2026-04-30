"use client";

import AdminSubrouteError from "@/components/admin/AdminSubrouteError";

export default function AdminFinanceReconciliationSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminSubrouteError
      {...props}
      kickerKey="admin_finance_reconciliation_title"
      dataTtRoot="admin-finance-reconciliation"
      logLabel="Admin finance reconciliation"
    />
  );
}
