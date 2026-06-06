/**
 * 公众 Feed 帖子解析：过滤自动化测试残留；空库时注入 curated showcase（① 本地走查）。
 */
import type { CommunityPost } from "@/lib/communityMockData";
import { communityFeedIsStagingSlug } from "@/components/community/communityFeedDisplayText";
import { dedupeCommunityFeedPostsById } from "@/components/community/mergeCommunityFeedLocalAndApiPosts";
import {
  communityShowcasePostsForFeedMode,
  filterPgSeedDuplicatesWhenShowcaseActive,
  shouldUseCommunityShowcaseOnEmpty,
} from "@/lib/communityShowcase";

/** ① C4/C5 烟测 · staging slug 帖（非用户可读 UGC，默认 Feed 不展示） */
export function isStagingSmokeCommunityPost(post: Pick<CommunityPost, "content" | "author" | "tags">): boolean {
  const body = (post.content ?? "").trim();
  if (!body) return false;
  if (/^(c4|c5)[-_]staging/i.test(body)) return true;
  if (/^c5-img-\d+/i.test((post.tags ?? [])[0]?.trim() ?? "")) return true;
  const nick = (post.author?.nickname ?? "").trim();
  if (nick === "C4 Video" || nick === "C5 Image") return true;
  return communityFeedIsStagingSlug(body);
}

/** E2E / PI-1 / MinIO 浏览器验收正文前缀（与后端 `community_public_surface` 同源）。 */
export function isAutomationCommunityPostBody(body: string | undefined | null): boolean {
  const b = (body ?? "").trim();
  return (
    b.startsWith("e2e-") ||
    b.startsWith("pi1-fe-") ||
    b.startsWith("browser-minio-")
  );
}

/** 客户端防御：剔除自动化帖（后端已过滤时通常 no-op）。 */
export function filterProductionCommunityPosts(posts: CommunityPost[]): CommunityPost[] {
  return posts.filter((p) => !isAutomationCommunityPostBody(p.content));
}

/** 公众 Feed 可读帖：production · 非 E2E · 非 C4/C5 staging 烟测 */
export function filterRealisticCommunityFeedPosts(posts: CommunityPost[]): CommunityPost[] {
  return filterProductionCommunityPosts(posts).filter((p) => !isStagingSmokeCommunityPost(p));
}

const FEED_REALISTIC_MERGE_MIN = 8;

/** ① 本地走查：薄 Feed 时注入 curated 视频 demo */
const SHOWCASE_VIDEO_INJECT_SLOTS = [1, 3, 5, 7, 9, 11] as const;

function isShowcaseVideoPost(post: Pick<CommunityPost, "type" | "is_video">): boolean {
  return post.is_video === true || post.type === "video";
}

/** 将缺失的 showcase 视频按固定槽位插入 Feed（不改变 L1 瀑布结构，仅增帖） */
export function injectShowcaseVideosIntoFeed(
  posts: CommunityPost[],
  videos: CommunityPost[],
): CommunityPost[] {
  if (videos.length === 0) return posts;
  const seen = new Set(posts.map((p) => p.id));
  const toInsert = videos.filter((v) => !seen.has(v.id));
  if (toInsert.length === 0) return posts;
  const next = posts.filter((p) => !toInsert.some((v) => v.id === p.id));
  toInsert.forEach((v, i) => {
    const slot = SHOWCASE_VIDEO_INJECT_SLOTS[i] ?? next.length;
    const at = Math.min(slot, next.length);
    next.splice(at, 0, v);
  });
  return next;
}

export type CommunityFeedShowcaseMode = "follow" | "hot" | "latest";

/**
 * 公众 Feed 展示帖：优先 API production 帖；无 production 且 showcase 开启时用 curated demo。
 */
export function resolveCommunityFeedDisplayPosts(
  apiPosts: CommunityPost[],
  mode: CommunityFeedShowcaseMode,
): CommunityPost[] {
  const realistic = filterPgSeedDuplicatesWhenShowcaseActive(filterRealisticCommunityFeedPosts(apiPosts));

  if (shouldUseCommunityShowcaseOnEmpty()) {
    const demo = communityShowcasePostsForFeedMode(mode);
    const demoVideos = demo.filter(isShowcaseVideoPost);
    if (realistic.length === 0) return demo;
    if (realistic.length < FEED_REALISTIC_MERGE_MIN) {
      const seen = new Set(realistic.map((p) => p.id));
      const merged = [...realistic, ...demo.filter((p) => !seen.has(p.id))];
      return dedupeCommunityFeedPostsById(injectShowcaseVideosIntoFeed(merged, demoVideos));
    }
    return dedupeCommunityFeedPostsById(realistic);
  }

  if (realistic.length > 0) return dedupeCommunityFeedPostsById(realistic);
  if (shouldUseCommunityShowcaseOnEmpty()) {
    return communityShowcasePostsForFeedMode(mode);
  }
  return realistic;
}

/** 分页追加：仅过滤 production 帖，不再注入 showcase（避免与首屏 curated 帖 duplicate key） */
export function resolveCommunityFeedAppendPosts(apiPosts: CommunityPost[]): CommunityPost[] {
  return filterPgSeedDuplicatesWhenShowcaseActive(filterRealisticCommunityFeedPosts(apiPosts));
}

/** Explore / 推荐作者：是否在 API 无 production 内容时 fallback showcase。 */
export function shouldFallbackCommunityExploreToShowcase(apiPosts: CommunityPost[]): boolean {
  return filterRealisticCommunityFeedPosts(apiPosts).length === 0 && shouldUseCommunityShowcaseOnEmpty();
}
