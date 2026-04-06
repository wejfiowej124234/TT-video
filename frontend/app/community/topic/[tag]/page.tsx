"use client";

import CommunityFeedMain from "@/components/community/CommunityFeedMain";
import { CommunityFeedRouteSuspense } from "@/components/community/CommunityFeedRouteSuspense";

/** 31 §2.1：话题聚合页（可分享 URL）；话题名由路径解析，见 useCommunityFeed。 */
export default function CommunityTopicPage() {
  return (
    <CommunityFeedRouteSuspense>
      <CommunityFeedMain />
    </CommunityFeedRouteSuspense>
  );
}
