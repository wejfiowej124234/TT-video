"use client";

import { CommunityMeDedicatedPageAuthGate } from "@/components/me/CommunityMeDedicatedPageAuthGate";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";
import { CommunityMeReportsPageMain } from "./CommunityMeReportsPageMain";
import { useCommunityMeReportsPage } from "./useCommunityMeReportsPage";

function CommunityMeReportsListPageInner() {
  const vm = useCommunityMeReportsPage();
  const { t, isLoggedIn, authPending, loginReturnPath } = vm;

  const authGate = (
    <CommunityMeDedicatedPageAuthGate
      t={t}
      isLoggedIn={isLoggedIn}
      authPending={authPending}
      pageDataAttr="reports"
      surfaceDataAttr="community_me_reports_auth_gate"
      ariaLabel={t("community_me_my_reports")}
      loginRequiredKey="community_report_ticket_login_required"
      loginReturnPath={loginReturnPath}
    />
  );

  if (authPending || !isLoggedIn) return authGate;

  return <CommunityMeReportsPageMain vm={vm} />;
}

/** 160：举报人工单列表（refactored VM · ①） */
export default function CommunityMeReportsListPage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="community_me_my_reports" horizontalPadding="px-4">
      <CommunityMeReportsListPageInner />
    </CommunityParamRouteSuspense>
  );
}
