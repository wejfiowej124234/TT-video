"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityCommentVisibilityPageMain } from "./AdminCommunityCommentVisibilityPageMain";

export default function AdminCommunityCommentVisibilityPage() {
  return (
    <AdminCommunityPageShell>
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_MODERATE} />
      <AdminCommunityCommentVisibilityPageMain />
    </AdminCommunityPageShell>
  );
}
