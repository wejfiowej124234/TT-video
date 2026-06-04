"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminGuideDetailPageMain } from "./AdminGuideDetailPageMain";

export default function AdminGuideDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_guide_detail_title">
      <AdminGuideDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
