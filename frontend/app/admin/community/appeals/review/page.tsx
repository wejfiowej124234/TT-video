"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityAppealReviewPageMain } from "./AdminCommunityAppealReviewPageMain";

export default function AdminCommunityAppealReviewPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_appeal_review_title"
      backLinkLabelKey="admin_community_reports_back"
      mainClassName="mx-auto flex min-h-[40vh] max-w-5xl flex-col items-center justify-center gap-6 p-6 sm:p-8"
    >
      <AdminCommunityPageShell currentLabelKey="admin_appeal_review_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_SUPER} />
        <AdminCommunityAppealReviewPageMain />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
