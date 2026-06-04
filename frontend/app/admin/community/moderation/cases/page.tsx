"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityModerationCasesPageMain } from "./AdminCommunityModerationCasesPageMain";
import { useAdminModerationCasesPage } from "./useAdminModerationCasesPage";

function AdminCommunityModerationCasesPageInner() {
  const vm = useAdminModerationCasesPage();
  return <AdminCommunityModerationCasesPageMain {...vm} />;
}

export default function AdminCommunityModerationCasesPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_mod_cases_title"
      backLinkLabelKey="admin_mod_cases_back"
    >
      <AdminCommunityPageShell currentLabelKey="admin_mod_cases_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_READ} />
        <AdminCommunityModerationCasesPageInner />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
