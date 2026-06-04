"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminMediaAccessLogsPageMain } from "./AdminMediaAccessLogsPageMain";

export default function AdminMediaAccessLogsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_media_access_logs_title">
      <AdminMediaAccessLogsPageMain />
    </AdminSearchParamsSuspense>
  );
}
