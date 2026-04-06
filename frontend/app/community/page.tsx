"use client";

import CommunityFeedMain from "@/components/community/CommunityFeedMain";
import { CommunityFeedRouteSuspense } from "@/components/community/CommunityFeedRouteSuspense";

/** 31 附录：潮流社区 · 动态 Feed（主入口；话题页见 `/community/topic/[tag]`）。 */
export default function CommunityPage() {
  return (
    <CommunityFeedRouteSuspense>
      <CommunityFeedMain />
    </CommunityFeedRouteSuspense>
  );
}
