"use client";

import { AdminCommunityPageShell } from "@/components/admin/AdminCommunityPageShell";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { AdminCommunityRiskSignalsPageMain } from "./AdminCommunityRiskSignalsPageMain";
import { useAdminCommunityRiskSignalsPage } from "./useAdminCommunityRiskSignalsPage";

function AdminCommunityRiskSignalsPageInner() {
  const vm = useAdminCommunityRiskSignalsPage();
  return <AdminCommunityRiskSignalsPageMain {...vm} />;
}

export default function AdminCommunityRiskSignalsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_risk_signals_title"
      backLinkLabelKey="admin_risk_signals_back"
    >
      <AdminCommunityPageShell currentLabelKey="admin_risk_signals_title">
        <AdminPermissionDeniedBanner permission={ADMIN_PERM.COMMUNITY_READ} />
        <AdminCommunityRiskSignalsPageInner />
      </AdminCommunityPageShell>
    </AdminSearchParamsSuspense>
  );
}
