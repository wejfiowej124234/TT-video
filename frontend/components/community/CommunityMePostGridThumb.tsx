"use client";

import Image from "next/image";
import type { CommunityPost } from "@/lib/communityMockData";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import {
  communityPostGridThumbRaw,
  resolveCommunityPostPlayableVideoUrl,
} from "@/components/community/communityFeedMappers";
import { CommunityFeedMasonryMediaFallback } from "@/components/community/CommunityFeedMasonryMediaFallback";
import { communityFeedMasonryPrimeVideoPreviewFrame } from "@/components/community/communityFeedMasonryMediaDisplay";

/** 我的发布 / 个人橱窗三列格：静图走 Next Image；无封面视频用 `<video>` 首帧，禁止把 `.mp4` 塞进 `/_next/image`。 */
export function CommunityMePostGridThumb({
  post,
  t,
  sizes = "(max-width:768px) 33vw, 200px",
}: {
  post: CommunityPost;
  t: (k: string) => string;
  sizes?: string;
}) {
  const isVideoPost = post.is_video === true || post.type === "video";
  const rawThumb = communityPostGridThumbRaw(post);
  const thumbSrc = rawThumb ? communityMediaAbsoluteUrlForRender(rawThumb) : "";
  const videoRaw = isVideoPost ? resolveCommunityPostPlayableVideoUrl(post) : undefined;
  const videoSrc = videoRaw ? communityMediaAbsoluteUrlForRender(videoRaw) : "";

  if (thumbSrc) {
    return (
      <Image
        src={thumbSrc}
        alt=""
        fill
        className="object-cover"
        sizes={sizes}
        loading="lazy"
        unoptimized={communityMediaNextImageUnoptimized(thumbSrc)}
      />
    );
  }

  if (videoSrc) {
    return (
      <video
        src={videoSrc}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
        aria-hidden
        onLoadedMetadata={(e) => communityFeedMasonryPrimeVideoPreviewFrame(e.currentTarget)}
      />
    );
  }

  return <CommunityFeedMasonryMediaFallback t={t} isVideo={isVideoPost} postType={post.type} />;
}
