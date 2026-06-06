"use client";

import CommunityFeedMain from "@/components/community/CommunityFeedMain";
import { CommunityFeedRouteSuspense } from "@/components/community/CommunityFeedRouteSuspense";
import type { CommunityFeedInitialSnapshot } from "@/lib/community/communityFeedInitialData";

/** 31 附录：潮流社区 · 动态 Feed（SSR 快照 hydration） */
export default function CommunityPageClient({
  initialSnapshot,
}: {
  initialSnapshot: CommunityFeedInitialSnapshot | null;
}) {
  return (
    <CommunityFeedRouteSuspense>
      <CommunityFeedMain initialSnapshot={initialSnapshot} />
    </CommunityFeedRouteSuspense>
  );
}
