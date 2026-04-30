"use client";

import AdminSubrouteError from "@/components/admin/AdminSubrouteError";

export default function AdminDriftSummarySegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminSubrouteError
      {...props}
      kickerKey="admin_drift_summary_title"
      dataTtRoot="admin-drift-summary"
      logLabel="Admin drift summary"
    />
  );
}
