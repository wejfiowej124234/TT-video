"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminGuideApplicationsPageMain } from "./AdminGuideApplicationsPageMain";

export default function AdminGuideApplicationsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_guide_list_title">
      <AdminGuideApplicationsPageMain />
    </AdminSearchParamsSuspense>
  );
}
