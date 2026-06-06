import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityVideoFeedItem } from "@/components/community/communityVideoOverlayTypes";
import {
  communityPostGridThumbRaw,
  resolveCommunityPostPlayableVideoUrl,
} from "@/components/community/communityFeedMappers";
import { communityMediaAbsoluteUrlForRender, communityMediaPlaybackUrlForRender } from "@/lib/communityMediaClientUrl";

export function buildCommunityVideoFeedItems(postsToShow: CommunityPost[]): CommunityVideoFeedItem[] {
  const posterFor = (p: CommunityPost) => {
    const fromCover = p.cover_url?.trim();
    if (fromCover) return communityMediaAbsoluteUrlForRender(fromCover);
    const grid = communityPostGridThumbRaw(p);
    const isVideo = p.is_video === true || p.type === "video";
    if (isVideo && grid && /\.(jpe?g|png|webp)(\?|#|$)/i.test(grid)) {
      return communityMediaAbsoluteUrlForRender(grid);
    }
    return undefined;
  };
  const fromFeed = postsToShow
    .filter((p) => p.is_video === true || p.type === "video")
    .map((p) => ({
      key: p.id,
      videoUrl: (() => {
        const raw = resolveCommunityPostPlayableVideoUrl(p);
        return raw ? communityMediaPlaybackUrlForRender(raw) : null;
      })(),
      posterUrl: posterFor(p),
      ...(p.primaryMediaAssetId?.trim()
        ? { primaryMediaAssetId: p.primaryMediaAssetId.trim() }
        : {}),
      caption: (p.title || p.content || "").trim() || undefined,
      author: p.author?.nickname?.trim() || p.author?.id,
      authorAvatarUrl: p.author?.avatar_url
        ? communityMediaAbsoluteUrlForRender(p.author.avatar_url)
        : null,
      authorId: p.author?.id ?? null,
      likes: p.likes,
      comments: p.comments,
      collects: p.collects,
    }));
  return fromFeed;
}
