"use client";

import type { CommunityMediaHeartBurst } from "./useCommunityMediaTapLike";
import { TT_COMMUNITY_VIDEO_OVERLAY_L5 } from "@/lib/marketingUi";

/** 双击点赞心形爆发动效（视频浮层 / 图文详情共用） */
export function CommunityMediaHeartBurstOverlay({
  burst,
}: {
  burst: CommunityMediaHeartBurst | null;
}) {
  if (!burst) return null;
  return (
    <span
      key={burst.key}
      className={`pointer-events-none absolute z-20 ${TT_COMMUNITY_VIDEO_OVERLAY_L5.heartBurst}`}
      style={{ left: burst.x, top: burst.y }}
      aria-hidden
    >
      <svg className="h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-ref-sun drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </span>
  );
}
