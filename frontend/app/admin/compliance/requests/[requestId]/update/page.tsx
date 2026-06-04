"use client";



import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";



import { AdminComplianceRequestUpdatePageMain } from "./AdminComplianceRequestUpdatePageMain";



export default function AdminComplianceRequestUpdatePage() {

  return (

    <AdminSearchParamsSuspense ariaLabelKey="admin_compliance_update_title">

      <AdminComplianceRequestUpdatePageMain />

    </AdminSearchParamsSuspense>

  );

}

