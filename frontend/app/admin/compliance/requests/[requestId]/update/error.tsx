"use client";

import AdminRouteErrorShell from "@/components/admin/AdminRouteErrorShell";

export default function AdminRouteSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminRouteErrorShell
      {...props}
      dataTtRoot="admin-compliance-requests-requestId-update"
      logLabel={"Admin compliance / requests / [requestId] / update"}
    />
  );
}
