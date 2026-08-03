"use client";

import AdminSubrouteError from "@/components/admin/AdminSubrouteError";

export default function AdminFinanceSuiteSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminSubrouteError
      {...props}
      kickerKey="admin_fin_suite_title"
      dataTtRoot="admin-finance-suite"
      logLabel="Admin finance suite"
    />
  );
}
