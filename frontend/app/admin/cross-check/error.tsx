"use client";

import AdminSubrouteError from "@/components/admin/AdminSubrouteError";

export default function AdminCrossCheckSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminSubrouteError
      {...props}
      kickerKey="admin_cross_check_title"
      dataTtRoot="admin-cross-check"
      logLabel="Admin cross-check"
    />
  );
}
