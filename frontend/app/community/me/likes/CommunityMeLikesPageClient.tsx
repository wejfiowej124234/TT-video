"use client";

import { CommunityMeDedicatedPageAuthGate } from "@/components/me/CommunityMeDedicatedPageAuthGate";
import { CommunityMeLikesPageMain } from "./CommunityMeLikesPageMain";
import { CommunityMeLikesPortals } from "./CommunityMeLikesPortals";
import { useCommunityMeLikesPage } from "./useCommunityMeLikesPage";

/** 31 附录：赞过列表独立页（仅 API · 与收藏/帖子页同构） */
export function CommunityMeLikesPageClient() {
  const vm = useCommunityMeLikesPage();
  const { t, isLoggedIn, authPending } = vm;

  const authGate = (
    <CommunityMeDedicatedPageAuthGate
      t={t}
      isLoggedIn={isLoggedIn}
      authPending={authPending}
      pageDataAttr="likes"
      surfaceDataAttr="community_me_likes_auth_gate"
      ariaLabel={t("community_me_likes_title")}
      loginRequiredKey="community_me_likes_login_required"
      loginReturnPath="/community/me/likes"
    />
  );
  if (authPending || !isLoggedIn) return authGate;

  return (
    <>
      <CommunityMeLikesPageMain vm={vm} />
      <CommunityMeLikesPortals vm={vm} />
    </>
  );
}
