"use client";

import { CommunityMeDedicatedPageAuthGate } from "@/components/me/CommunityMeDedicatedPageAuthGate";
import { CommunityMeCollectsPageMain } from "./CommunityMeCollectsPageMain";
import { CommunityMeCollectsPortals } from "./CommunityMeCollectsPortals";
import { useCommunityMeCollectsPage } from "./useCommunityMeCollectsPage";

/** 31 附录 / 51-31-19：我的收藏（仅 API · refactored VM） */
export default function CommunityMeCollectsPage() {
  const vm = useCommunityMeCollectsPage();
  const { t, isLoggedIn, authPending } = vm;

  const authGate = (
    <CommunityMeDedicatedPageAuthGate
      t={t}
      isLoggedIn={isLoggedIn}
      authPending={authPending}
      pageDataAttr="collects"
      surfaceDataAttr="community_me_collects_auth_gate"
      ariaLabel={t("community_me_my_collects")}
      loginRequiredKey="community_me_collects_login_required"
      loginReturnPath="/community/me/collects"
    />
  );
  if (authPending || !isLoggedIn) return authGate;

  return (
    <>
      <CommunityMeCollectsPageMain vm={vm} />
      <CommunityMeCollectsPortals vm={vm} />
    </>
  );
}
