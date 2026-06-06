"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityAppealReviewPageMain } from "./AdminCommunityAppealReviewPageMain";

export default function AdminCommunityAppealReviewPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_appeal_review_title" loadingVariant="detail">
      <AdminCommunityPageShell>
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_SUPER} />
        <AdminCommunityAppealReviewPageMain />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
