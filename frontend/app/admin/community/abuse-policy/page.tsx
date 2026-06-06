"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityAbusePolicyPageMain } from "./AdminCommunityAbusePolicyPageMain";

export default function AdminCommunityAbusePolicyPage() {
  return (
    <AdminCommunityPageShell>
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_SUPER} />
      <AdminCommunityAbusePolicyPageMain />
    </AdminCommunityPageShell>
  );
}
