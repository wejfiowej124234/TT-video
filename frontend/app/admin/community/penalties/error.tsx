"use client";

import AdminRouteErrorShell from "@/components/admin/AdminRouteErrorShell";

export default function AdminRouteSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminRouteErrorShell
      {...props}
      dataTtRoot="admin-community-penalties"
      logLabel={"Admin community / penalties"}
    />
  );
}
