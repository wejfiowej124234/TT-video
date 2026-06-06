/** 烟测 1×1 PNG 等极小图在瀑布卡 `object-cover` 下会像纯色块 — 改 `object-contain` */
export const COMMUNITY_FEED_MASONRY_TINY_IMAGE_MAX_PX = 16;

export function communityFeedMasonryImageIsTiny(
  naturalWidth: number,
  naturalHeight: number,
): boolean {
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight)) return false;
  if (naturalWidth <= 0 || naturalHeight <= 0) return false;
  return (
    naturalWidth <= COMMUNITY_FEED_MASONRY_TINY_IMAGE_MAX_PX ||
    naturalHeight <= COMMUNITY_FEED_MASONRY_TINY_IMAGE_MAX_PX
  );
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
