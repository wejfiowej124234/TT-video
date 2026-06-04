"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityPenaltiesPageMain } from "./AdminCommunityPenaltiesPageMain";

export default function AdminCommunityPenaltiesPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_penalties_title"
      backLinkLabelKey="admin_penalties_back"
    >
      <AdminCommunityPageShell currentLabelKey="admin_penalties_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_MODERATE} />
        <AdminCommunityPenaltiesPageMain />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
