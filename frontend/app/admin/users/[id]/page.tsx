"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminUserDetailPageMain } from "./AdminUserDetailPageMain";

export default function AdminUserDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_user_detail_title">
      <AdminUserDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
