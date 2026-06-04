"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminReviewsPageMain } from "./AdminReviewsPageMain";

export default function AdminReviewsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_reviews_title">
      <AdminReviewsPageMain />
    </AdminSearchParamsSuspense>
  );
}
