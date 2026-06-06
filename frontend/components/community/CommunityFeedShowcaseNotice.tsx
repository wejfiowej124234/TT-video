"use client";

import type { CommunityPost } from "@/lib/communityMockData";
import { isShowcasePostId } from "@/lib/communityShowcase";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

/** Feed 含 curated 演示帖时提示：评论/赞等与本机演示环境行为（非 API 权限 bug） */
export function CommunityFeedShowcaseNotice({
  posts,
  t,
}: {
  posts: readonly CommunityPost[];
  t: (key: string) => string;
}) {
  const showcaseCount = posts.filter((p) => isShowcasePostId(p.id)).length;
  if (showcaseCount === 0) return null;
  const hasProduction = posts.some((p) => !isShowcasePostId(p.id));
  return (
    <div
      className={`${TT_COMMUNITY_DRAWER_L5.postDetailShowcaseHint} mb-2 px-3 py-2 text-meta leading-snug`}
      role="note"
      data-tt-community-feed-showcase="active-v1"
      data-testid="community-feed-showcase-notice"
    >
      <p>
        {t("community_feed_showcase_banner")}
        {hasProduction ? (
          <span className="text-slate-200"> · {t("community_feed_showcase_mixed_hint")}</span>
        ) : null}
      </p>
    </div>
  );
}
