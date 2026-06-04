"use client";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminSchedulerJobsPageMain } from "./AdminSchedulerJobsPageMain";

export default function AdminSchedulerJobsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_scheduler_jobs_title">
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.APPROVE} />
      <AdminSchedulerJobsPageMain />
    </AdminSearchParamsSuspense>
  );
}
