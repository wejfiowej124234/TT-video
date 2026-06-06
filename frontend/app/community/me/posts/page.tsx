"use client";

import { CommunityMeDedicatedPageAuthGate } from "@/components/me/CommunityMeDedicatedPageAuthGate";
import { CommunityMePostsPageMain } from "./CommunityMePostsPageMain";
import { CommunityMePostsPortals } from "./CommunityMePostsPortals";
import { useCommunityMePostsPage } from "./useCommunityMePostsPage";

/** 31 附录 / 51-31-19：我的帖子（仅 API · refactored VM） */
export default function CommunityMePostsPage() {
  const vm = useCommunityMePostsPage();
  const { t, isLoggedIn, authPending } = vm;

  const authGate = (
    <CommunityMeDedicatedPageAuthGate
      t={t}
      isLoggedIn={isLoggedIn}
      authPending={authPending}
      pageDataAttr="posts"
      surfaceDataAttr="community_me_posts_auth_gate"
      ariaLabel={t("community_me_my_posts")}
      loginRequiredKey="community_me_posts_login_required"
      loginReturnPath="/community/me/posts"
    />
  );
  if (authPending || !isLoggedIn) return authGate;

  return (
    <>
      <CommunityMePostsPageMain vm={vm} />
      <CommunityMePostsPortals vm={vm} />
    </>
  );
}
