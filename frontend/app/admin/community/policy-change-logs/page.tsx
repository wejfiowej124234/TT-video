"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityPolicyChangeLogsPageMain } from "./AdminCommunityPolicyChangeLogsPageMain";

export default function AdminCommunityPolicyChangeLogsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_policy_logs_title"
      backLinkLabelKey="admin_policy_logs_back"
    >
      <AdminCommunityPageShell currentLabelKey="admin_policy_logs_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_READ} />
        <AdminCommunityPolicyChangeLogsPageMain />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
