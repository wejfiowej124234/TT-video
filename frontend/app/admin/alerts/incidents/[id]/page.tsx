"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminAlertIncidentDetailPageMain } from "./AdminAlertIncidentDetailPageMain";

export default function AdminAlertIncidentDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_alert_incident_detail_title">
      <AdminAlertIncidentDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
