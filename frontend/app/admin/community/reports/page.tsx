"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityReportsPageInner } from "./AdminCommunityReportsPageInner";

export default function AdminCommunityReportsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_community_reports_title"
      backLinkLabelKey="admin_community_reports_back"
    >
      <AdminCommunityPageShell currentLabelKey="admin_community_reports_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_READ} />
        <AdminCommunityReportsPageInner />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
