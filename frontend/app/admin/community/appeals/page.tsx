"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityAppealsPageMain } from "./AdminCommunityAppealsPageMain";

export default function AdminCommunityAppealsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_appeals_title">
      <AdminCommunityPageShell>
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_READ} />
        <AdminCommunityAppealsPageMain />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
