import type { CommunityPost } from "@/lib/communityMockData";
import { communityPostGridThumbRaw } from "@/components/community/communityFeedMappersRoleAndMedia";
import { isShowcasePostId, shouldUseCommunityShowcaseOnEmpty } from "@/lib/communityShowcase";
import { isCommunityContentProductionProfile } from "@/lib/communityContentProfile";
import {
  communityFeedPromoHotCheckins,
  communityFeedPromoHotScore,
} from "@/components/community/communityFeedMasonryAspect";
import { communityFeedStableDistanceKm } from "@/components/community/communityFeedLocationDistance";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaIsStillImageUrl,
} from "@/lib/communityMediaClientUrl";

/** Promo 插槽 · 可渲染 still 缩略图（含视频 cover） */
export function communityFeedPromoStillThumbSrc(post: CommunityPost | undefined): string | undefined {
  if (!post) return undefined;
  const raw = communityPostGridThumbRaw(post);
  if (!raw) return undefined;
  const abs = communityMediaAbsoluteUrlForRender(raw);
  if (!abs || !communityMediaIsStillImageUrl(abs)) return undefined;
  return abs;
}

/** 热榜行 · 优先 Feed 内同目的地且有缩略图的帖子 */
export function communityFeedPromoPostForDestination(
  posts: readonly CommunityPost[],
  destination: string,
): CommunityPost | undefined {
  const withThumb = posts.find(
    (p) => p.destination === destination && communityFeedPromoStillThumbSrc(p),
  );
  if (withThumb) return withThumb;
  return posts.find((p) => p.destination === destination);
}

/** 活动卡跳转 · 优先帖子深链，其次目的地 Feed */
export function communityFeedPromoPostHref(post: CommunityPost | undefined): string | undefined {
  const id = post?.id?.trim();
  if (!id) return undefined;
  return `/community?post=${encodeURIComponent(id)}`;
}

/** 活动卡跳转 · 有帖子 id 则开详情深链，否则目的地 / 探索 */
export function communityFeedPromoActivityHref(post: CommunityPost | undefined): string {
  const postHref = communityFeedPromoPostHref(post);
  if (postHref) return postHref;
  const dest = post?.destination?.trim();
  if (dest) return communityFeedPromoDestinationHref(dest);
  return "/community/activity";
}

export function communityFeedPromoDestinationHref(destination: string): string {
  return `/community?destination=${encodeURIComponent(destination)}`;
}

/** 活动卡 preview：Production 用 governed Feed 帖；本地 showcase 模式可优先 demo 帖 */
export function pickCommunityFeedPromoPreviewPost(
  posts: readonly CommunityPost[],
): CommunityPost | undefined {
  const withThumb = posts.filter((p) => communityFeedPromoStillThumbSrc(p));
  if (isCommunityContentProductionProfile()) {
    return withThumb.find((p) => !isShowcasePostId(p.id));
  }
  if (shouldUseCommunityShowcaseOnEmpty()) {
    const showcase = withThumb.find((p) => isShowcasePostId(p.id));
    if (showcase) return showcase;
  }
  return withThumb.find((p) => !isShowcasePostId(p.id));
}

/** 瀑布网格 · 去掉已在活动卡展示的 preview 帖，避免重复 */
export function communityFeedMasonryPostsExcludingPromoPreview(
  posts: readonly CommunityPost[],
  opts: { showPromoSlots: boolean; previewPost?: CommunityPost },
): CommunityPost[] {
  if (!opts.showPromoSlots) return [...posts];
  const previewId = opts.previewPost?.id?.trim();
  if (!previewId) return [...posts];
  return posts.filter((p) => p.id !== previewId);
}

export type CommunityFeedHotDestinationRow = {
  destination: string;
  rankIndex: number;
  thumbSrc?: string;
  score: string;
  checkins: number;
  distanceKm: string;
  /** API `distance_m` 已 enrich 时为 true（热榜/侧栏展示真距离，非稳定占位） */
  distanceFromFeedGeo: boolean;
  /** 同目的地帖有点赞/评论合计时为 true；否则为稳定占位打卡量 */
  checkinsFromFeedInteraction: boolean;
  /** 同目的地帖有点赞/评论合计时为 true；否则为稳定占位评分 */
  scoreFromFeedInteraction: boolean;
  href: string;
};

/** 热榜互动是否来自 Feed 真帖（非 `communityFeedPromoHot*` 占位） */
export function communityFeedHotDestinationMetricsFromFeed(
  posts: readonly CommunityPost[],
  destination: string,
): { checkinsFromFeedInteraction: boolean; scoreFromFeedInteraction: boolean } {
  const matched = posts.filter((p) => p.destination === destination);
  if (matched.length === 0) {
    return { checkinsFromFeedInteraction: false, scoreFromFeedInteraction: false };
  }
  const total = matched.reduce((acc, p) => acc + p.likes + p.comments, 0);
  const fromFeed = total > 0;
  return { checkinsFromFeedInteraction: fromFeed, scoreFromFeedInteraction: fromFeed };
}

/** 热榜 / 侧栏同源 · 目的地行数据 */
export function communityFeedHotDestinationRows(
  hotDestinations: readonly string[],
  feedPosts: readonly CommunityPost[],
  limit = 8,
): CommunityFeedHotDestinationRow[] {
  return hotDestinations.slice(0, limit).map((dest, i) => {
    const matched = communityFeedPromoPostForDestination(feedPosts, dest);
    const withGeo = feedPosts.filter(
      (p) =>
        p.destination === dest &&
        p.distanceM != null &&
        Number.isFinite(p.distanceM) &&
        p.distanceM >= 0,
    );
    const distanceFromFeedGeo = withGeo.length > 0;
    const distanceKm = distanceFromFeedGeo
      ? (Math.min(...withGeo.map((p) => p.distanceM!)) / 1000).toFixed(1)
      : communityFeedStableDistanceKm(`hot:${dest}:${i}`, { min: 0.5, max: 12 });
    const metricsFromFeed = communityFeedHotDestinationMetricsFromFeed(feedPosts, dest);
    return {
      destination: dest,
      rankIndex: i,
      thumbSrc: communityFeedPromoStillThumbSrc(matched),
      score: communityFeedPromoDestinationScore(feedPosts, dest, i),
      checkins: communityFeedPromoDestinationCheckins(feedPosts, dest, i),
      distanceKm,
      distanceFromFeedGeo,
      checkinsFromFeedInteraction: metricsFromFeed.checkinsFromFeedInteraction,
      scoreFromFeedInteraction: metricsFromFeed.scoreFromFeedInteraction,
      href: communityFeedPromoDestinationHref(dest),
    };
  });
}

/** 热榜打卡量 · Feed 内同目的地互动合计，无数据时回落占位 */
export function communityFeedPromoDestinationCheckins(
  posts: readonly CommunityPost[],
  destination: string,
  rankIndex: number,
): number {
  const matched = posts.filter((p) => p.destination === destination);
  if (matched.length === 0) return communityFeedPromoHotCheckins(rankIndex);
  const total = matched.reduce((acc, p) => acc + p.likes + p.comments, 0);
  return total > 0 ? total : communityFeedPromoHotCheckins(rankIndex);
}

/** 热榜评分 · 有真实互动则微调，否则占位 */
export function communityFeedPromoDestinationScore(
  posts: readonly CommunityPost[],
  destination: string,
  rankIndex: number,
): string {
  const matched = posts.filter((p) => p.destination === destination);
  if (matched.length === 0) return communityFeedPromoHotScore(rankIndex);
  const total = matched.reduce((acc, p) => acc + p.likes + p.comments, 0);
  if (total <= 0) return communityFeedPromoHotScore(rankIndex);
  const boost = Math.min(0.08, total / 5000);
  return Math.min(5, 4.75 + boost - rankIndex * 0.05).toFixed(1);
}
