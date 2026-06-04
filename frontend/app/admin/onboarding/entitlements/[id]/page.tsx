"use client";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";

import { AdminOnboardingEntitlementDetailPageMain } from "./AdminOnboardingEntitlementDetailPageMain";

export default function AdminOnboardingEntitlementDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_onb_ent_detail_title">
      <AdminOnboardingEntitlementDetailPageMain />
    </AdminSearchParamsSuspense>
  );
}
