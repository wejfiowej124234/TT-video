"use client";

import AdminSubrouteError from "@/components/admin/AdminSubrouteError";

export default function AdminOrderDetailSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminSubrouteError
      {...props}
      kickerKey="admin_orders_title"
      dataTtRoot="admin-order-detail"
      logLabel="Admin order detail"
    />
  );
}
