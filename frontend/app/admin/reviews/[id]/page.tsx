"use client";



import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";



import { AdminReviewDetailPageMain } from "./AdminReviewDetailPageMain";



export default function AdminReviewDetailPage() {

  return (

    <AdminSearchParamsSuspense ariaLabelKey="admin_review_detail_title">

      <AdminReviewDetailPageMain />

    </AdminSearchParamsSuspense>

  );

}

