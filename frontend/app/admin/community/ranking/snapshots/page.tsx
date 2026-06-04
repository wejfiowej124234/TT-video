"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityRankingSnapshotsPageMain } from "./AdminCommunityRankingSnapshotsPageMain";

export default function AdminCommunityRankingSnapshotsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_rank_snapshots_title"
      backLinkLabelKey="admin_rank_snapshots_back"
    >
      <AdminCommunityPageShell currentLabelKey="admin_rank_snapshots_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_READ} />
        <AdminCommunityRankingSnapshotsPageMain />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
