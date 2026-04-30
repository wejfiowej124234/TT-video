"use client";

import AdminSubrouteError from "@/components/admin/AdminSubrouteError";

export default function AdminFinanceSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminSubrouteError
      {...props}
      kickerKey="admin_finance_title"
      dataTtRoot="admin-finance"
      logLabel="Admin finance"
    />
  );
}
