/**
 * 社区作者角色规范化、角色 pill 样式、帖子可播放视频 URL 与网格缩略图源（与 {@link communityFeedMappers} 同簇）。
 */
import type { CommunityPost } from "@/lib/communityMockData";
import { communityMediaAssetPlaybackUrlFromIds } from "@/lib/communityMediaClientUrl";

/** 700：与 **04 §二 2.1** **`users.role`** 白名单一致；小写规范化，供 **`communityStoredRoleLabelI18nKey`**；未知值回退 **`tourist`**。 */
const COMMUNITY_AUTHOR_ROLES_KNOWN = new Set([
  "guide",
  "tourist",
  "traveler",
  "provider",
  "region_steward",
  "arbitrator",
  "admin",
  "super_admin",
]);

export function mapApiUserRoleToCommunity(r: string | null | undefined): string {
  const x = (r ?? "").trim().toLowerCase();
  if (COMMUNITY_AUTHOR_ROLES_KNOWN.has(x)) return x;
  return "tourist";
}

/**
 * 701：社区角色小圆点背景色（须传入已 **`mapApiUserRoleToCommunity`** 的 **`role`** 串；与 **700** 白名单一致）。
 */
export function communityStoredRolePillClassName(role: string): string {
  switch (role) {
    case "guide":
      return "bg-ref-sun/14 text-ref-sun";
    case "provider":
      return "bg-amber-500/20 text-amber-200";
    case "region_steward":
      return "bg-violet-500/20 text-violet-200";
    case "arbitrator":
      return "bg-slate-500/30 text-slate-200";
    case "admin":
      return "bg-orange-500/20 text-orange-200";
    case "super_admin":
      return "bg-rose-500/20 text-rose-200";
    case "tourist":
    case "traveler":
    default:
      return "bg-ref-sun/10 text-ref-sun/85";
  }
}

/** 常见可播放后缀；避免把首张 JPG 当 `media_urls[0]` 喂给 `<video>`（多图+视频或封面在前的 API 形态）。 */
const COMMUNITY_PLAYABLE_VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

/**
 * 从帖子字段中解析应在 `<video src>` 使用的 URL。视频帖若 `media_urls` 含多段素材，优先选**首个**可播放视频链。
 */
export function resolveCommunityPostPlayableVideoUrl(
  post: Pick<
    CommunityPost,
    "media_url" | "media_urls" | "is_video" | "type" | "primaryMediaAssetId" | "author"
  >,
): string | undefined {
  const isVideoPost = post.is_video === true || post.type === "video";
  if (!isVideoPost) return undefined;
  const seen = new Set<string>();
  const push = (u: string) => {
    const x = u.trim();
    if (x && !seen.has(x)) {
      seen.add(x);
      return x;
    }
    return null;
  };
  const ordered: string[] = [];
  const primary = push(post.media_url ?? "");
  if (primary) ordered.push(primary);
  for (const raw of post.media_urls ?? []) {
    const u = push(typeof raw === "string" ? raw : "");
    if (u) ordered.push(u);
  }
  const playable = ordered.find((u) => COMMUNITY_PLAYABLE_VIDEO_RE.test(u));
  if (playable) return playable;
  if (ordered.length > 0) return ordered[0];
  const assetId = post.primaryMediaAssetId?.trim();
  if (assetId) {
    const fromIds = communityMediaAssetPlaybackUrlFromIds(post.author?.id, assetId);
    if (fromIds) return fromIds;
    return `https://cdn.example.test/playback/${assetId}.mp4`;
  }
  return undefined;
}

const COMMUNITY_STILL_IMAGE_RE = /\.(jpe?g|png|webp)(\?|#|$)/i;

function communityPostMediaList(post: Pick<CommunityPost, "media_url" | "media_urls">): string[] {
  const { media_url, media_urls } = post;
  return media_urls && media_urls.length > 0 ? media_urls : media_url ? [media_url] : [];
}

/**
 * 网格/紧凑卡片缩略图源（仍为相对路径时须再套 `communityMediaAbsoluteUrlForRender`）：
 * 视频帖优先 `cover_url`，否则首张 jpg/png/webp，再回落主媒体；与 me/posts、发现页口径一致。
 */
export function communityPostGridThumbRaw(post: CommunityPost): string {
  const isVid = post.type === "video" || post.is_video === true;
  if (isVid && post.cover_url?.trim()) return post.cover_url.trim();
  const imgs = communityPostMediaList(post);
  if (isVid && imgs.length) {
    const still = imgs.find((u) => COMMUNITY_STILL_IMAGE_RE.test(u));
    if (still) return still.trim();
    return "";
  }
  const fallback = (imgs[0] ?? post.media_url ?? "").trim();
  if (isVid && COMMUNITY_PLAYABLE_VIDEO_RE.test(fallback)) return "";
  return fallback;
}
