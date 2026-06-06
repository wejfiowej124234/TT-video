"use client";

import type { CommunityPostType } from "@/lib/communityMockData";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

const TYPE_GRADIENT: Partial<Record<CommunityPostType, string>> = {
  photo: "from-rose-900/40 via-ink-900 to-ink-950",
  video: "from-sky-900/35 via-ink-900 to-ink-950",
  food: "from-amber-900/35 via-ink-900 to-ink-950",
  travel: "from-emerald-900/30 via-ink-900 to-ink-950",
  text: "from-ink-800 via-ink-900 to-ink-950",
};

export function CommunityFeedMasonryMediaFallback({
  t,
  isVideo,
  postType,
  onRetry,
  loading = false,
}: {
  t: (key: string) => string;
  isVideo: boolean;
  postType?: CommunityPostType;
  onRetry?: () => void;
  /** 媒体加载中（非失败） */
  loading?: boolean;
}) {
  const grad = TYPE_GRADIENT[postType ?? (isVideo ? "video" : "photo")] ?? TYPE_GRADIENT.photo;

  return (
    <div
      className={`${TT_COMMUNITY_FEED_ACTION.masonryCardMediaFallback} bg-gradient-to-br ${grad}`}
      role="img"
    >
      <span className={TT_COMMUNITY_FEED_ACTION.masonryCardMediaFallbackIcon} aria-hidden>
        {isVideo ? (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </span>
      <span className="text-micro text-slate-400">
        {loading
          ? t("community_media_loading")
          : postType
            ? t(`community_type_${postType}`)
            : t("community_media_load_failed")}
      </span>
      {onRetry ? (
        <button
          type="button"
          className="mt-1 rounded-full border border-ref-sun/30 bg-ref-sun/10 px-2.5 py-1 text-[0.62rem] text-ref-sun/90 motion-sub hover:bg-ref-sun/16"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRetry();
          }}
        >
          {t("community_media_retry")}
        </button>
      ) : null}
    </div>
  );
}
