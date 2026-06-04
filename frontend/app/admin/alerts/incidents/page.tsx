"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminAlertIncidentsHubPageMain } from "./AdminAlertIncidentsHubPageMain";

export default function AdminAlertIncidentsHubPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_alert_incident_hub_title">
      <AdminAlertIncidentsHubPageMain />
    </AdminSearchParamsSuspense>
  );
}
