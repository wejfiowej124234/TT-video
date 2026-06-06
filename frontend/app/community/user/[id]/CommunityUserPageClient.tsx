"use client";

import { CommunityUserPageMain } from "./CommunityUserPageMain";
import { CommunityUserPageNotFoundView } from "./CommunityUserPageNotFoundView";
import { CommunityUserPageOverlays } from "./CommunityUserPageOverlays";
import { useCommunityUserPageCore } from "./useCommunityUserPageCore";

/** 作者主页：GET /api/v1/community/users/:id/posts · refactored VM + 拆分组件 */
export function CommunityUserPageClient() {
  const core = useCommunityUserPageCore();

  if (!core.hasValidProfileId) {
    return <CommunityUserPageNotFoundView />;
  }

  return (
    <>
      <CommunityUserPageMain core={core} />
      <CommunityUserPageOverlays core={core} />
    </>
  );
}
