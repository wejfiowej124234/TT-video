"use client";



import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";



import { AdminStewardApplicationsPageMain } from "./AdminStewardApplicationsPageMain";



export default function AdminStewardApplicationsPage() {

  return (

    <AdminSearchParamsSuspense ariaLabelKey="admin_steward_list_title">

      <AdminStewardApplicationsPageMain />

    </AdminSearchParamsSuspense>

  );

}

