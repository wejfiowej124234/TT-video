import type { CommunityPost } from "@/lib/communityMockData";
import { communityPostGridThumbRaw } from "@/components/community/communityFeedMappersRoleAndMedia";

const COMMUNITY_PLAYABLE_VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function postMediaList(post: Pick<CommunityPost, "media_url" | "media_urls">): string[] {
  const { media_url, media_urls } = post;
  return media_urls && media_urls.length > 0 ? media_urls : media_url ? [media_url] : [];
}

function isStillImageUrl(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  if (COMMUNITY_PLAYABLE_VIDEO_RE.test(u)) return false;
  return true;
}

/** 帖详情媒体图源（与 Feed 缩略图同源 · 含 cover 回落；排除视频链） */
export function resolvePostDetailImageSources(post: CommunityPost): string[] {
  const isVideoPost = post.is_video === true || post.type === "video";
  if (isVideoPost) return [];

  const list = postMediaList(post)
    .map((u) => u.trim())
    .filter(isStillImageUrl);
  if (list.length > 0) return list;

  const thumb = communityPostGridThumbRaw(post).trim();
  if (thumb && isStillImageUrl(thumb)) return [thumb];

  const cover = post.cover_url?.trim();
  if (cover && isStillImageUrl(cover)) return [cover];

  return [];
}
