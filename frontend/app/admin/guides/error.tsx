"use client";

import AdminSubrouteError from "@/components/admin/AdminSubrouteError";

export default function AdminGuidesListSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminSubrouteError
      {...props}
      kickerKey="admin_guides_title"
      dataTtRoot="admin-guides"
      logLabel="Admin guides"
    />
  );
}
