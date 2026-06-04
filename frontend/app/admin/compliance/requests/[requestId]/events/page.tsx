"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminComplianceRequestEventsPageMain } from "./AdminComplianceRequestEventsPageMain";

export default function AdminComplianceRequestEventsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_compliance_events_title">
      <AdminComplianceRequestEventsPageMain />
    </AdminSearchParamsSuspense>
  );
}
