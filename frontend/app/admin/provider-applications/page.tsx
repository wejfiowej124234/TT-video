"use client";



import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";



import { AdminProviderApplicationsPageMain } from "./AdminProviderApplicationsPageMain";



export default function AdminProviderApplicationsPage() {

  return (

    <AdminSearchParamsSuspense ariaLabelKey="admin_provider_list_title">

      <AdminProviderApplicationsPageMain />

    </AdminSearchParamsSuspense>

  );

}

