import {
  L5_CARD_MEDIA_TINY_MAX_PX,
  l5CardMediaIsTiny,
} from "@/lib/l5CardMediaPlaceholder";

/** @deprecated use `L5_CARD_MEDIA_TINY_MAX_PX` */
export const COMMUNITY_FEED_MASONRY_TINY_IMAGE_MAX_PX = L5_CARD_MEDIA_TINY_MAX_PX;

export function communityFeedMasonryImageIsTiny(
  naturalWidth: number,
  naturalHeight: number,
): boolean {
  return l5CardMediaIsTiny(naturalWidth, naturalHeight);
}

/** 无封面视频卡：seek 到首帧作预览（① 本地 staging MP4） */
export const COMMUNITY_FEED_MASONRY_VIDEO_PREVIEW_SEC = 0.01;

export function communityFeedMasonryPrimeVideoPreviewFrame(video: HTMLVideoElement | null): void {
  if (!video) return;
  try {
    if (video.currentTime < COMMUNITY_FEED_MASONRY_VIDEO_PREVIEW_SEC) {
      video.currentTime = COMMUNITY_FEED_MASONRY_VIDEO_PREVIEW_SEC;
    }
  } catch {
    /* ignore seek before metadata */
  }
}
