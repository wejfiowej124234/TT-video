"use client";

import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, RefObject, TouchEvent } from "react";
import type { CommunityVideoFeedItem } from "./communityVideoOverlayTypes";
import { CommunityVideoOverlayCaption } from "./CommunityVideoOverlayCaption";
import { formatCommunityVideoClock } from "./communityVideoOverlayUtils";
import { TT_COMMUNITY_VIDEO_OVERLAY_L5 } from "@/lib/marketingUi";

export type CommunityVideoOverlayStageProps = {
  t: (key: string) => string;
  videoDescId: string;
  bindWheelAreaRef: (el: HTMLDivElement | null) => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  itemsLen: number;
  safeIndex: number;
  showNoVideo: boolean;
  atLast: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  current: CommunityVideoFeedItem | undefined;
  src: string;
  poster: string | undefined;
  muted: boolean;
  paused: boolean;
  togglePlay: () => void;
  setPaused: (v: boolean) => void;
  setVideoError: (v: boolean) => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  atFirst: boolean;
  clockCur: number;
  clockDur: number;
  progress: number;
  progressTrackRef: RefObject<HTMLDivElement | null>;
  onProgressPointerDown: (e: ReactPointerEvent) => void;
  onProgressKeyDown: (e: ReactKeyboardEvent) => void;
  slideDir: 1 | -1 | 0;
  commentsOpen?: boolean;
  buffering?: boolean;
  setBuffering?: (v: boolean) => void;
  chromeVisible?: boolean;
  showChrome?: () => void;
  onVideoPointerTap?: (clientX: number, clientY: number) => void;
  mediaRetryKey?: number;
  onMediaRetry?: () => void;
  feedLoadingMore?: boolean;
  hasVideoSrc?: boolean;
};

export function CommunityVideoOverlayStage({
  t,
  videoDescId,
  bindWheelAreaRef,
  onTouchStart,
  onTouchEnd,
  itemsLen,
  safeIndex,
  showNoVideo,
  atLast,
  videoRef,
  current,
  src,
  poster,
  muted,
  paused,
  togglePlay,
  setPaused,
  setVideoError,
  onTimeUpdate,
  onLoadedMetadata,
  atFirst,
  clockCur,
  clockDur,
  progress,
  progressTrackRef,
  onProgressPointerDown,
  onProgressKeyDown,
  slideDir,
  commentsOpen = false,
  buffering = false,
  setBuffering,
  chromeVisible = true,
  showChrome,
  onVideoPointerTap,
  mediaRetryKey = 0,
  onMediaRetry,
  hasVideoSrc = false,
  feedLoadingMore = false,
}: CommunityVideoOverlayStageProps) {
  const slideClass =
    slideDir === 1
      ? TT_COMMUNITY_VIDEO_OVERLAY_L5.slideEnterFromBottom
      : slideDir === -1
        ? TT_COMMUNITY_VIDEO_OVERLAY_L5.slideEnterFromTop
        : "";
  const chromeHidden = !chromeVisible && !paused && !commentsOpen;

  return (
    <>
      <p id={videoDescId} className="sr-only">
        {t("community_video_swipe_hint")}
      </p>

      <div
        ref={bindWheelAreaRef}
        className="relative flex-1 min-h-0 w-full flex items-stretch justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {itemsLen > 1 && !commentsOpen ? (
          <span className={TT_COMMUNITY_VIDEO_OVERLAY_L5.videoIndexPill} aria-live="polite">
            {safeIndex + 1} / {itemsLen}
          </span>
        ) : null}

        {itemsLen === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-slate-300 text-small" role="status">
            {t("community_video_no_source")}
          </div>
        ) : showNoVideo ? (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center" role="alert" aria-live="polite">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element -- overlay poster fallback when `<video>` fails
              <img
                src={poster}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35 blur-[1px]"
              />
            ) : null}
            <div className="relative z-[2] flex flex-col items-center gap-3">
              <p className="text-small text-slate-200">
                {hasVideoSrc ? t("community_media_load_failed") : t("community_video_no_source")}
              </p>
              {hasVideoSrc && onMediaRetry ? (
                <button
                  type="button"
                  onClick={onMediaRetry}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/45 bg-ref-sun/15 px-5 text-meta font-semibold text-ref-sun/95 hover:bg-ref-sun/22 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun"
                >
                  {t("common_retry")}
                </button>
              ) : null}
              {!hasVideoSrc && !atLast ? (
                <p className="text-meta text-slate-500">{t("community_video_swipe_hint")}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            key={`${current?.key ?? "v"}-${src}-${mediaRetryKey}`}
            className={`absolute inset-0 ${TT_COMMUNITY_VIDEO_OVERLAY_L5.slideEnter} ${slideClass}`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('[role="slider"]')) return;
              onVideoPointerTap?.(e.clientX, e.clientY);
            }}
          >
            <video
              key={`${current?.key ?? "v"}-${mediaRetryKey}`}
              ref={videoRef}
              src={src}
              poster={poster}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted={muted}
              loop
              preload="auto"
              aria-label={current?.caption?.slice(0, 80) || t("community_video_playing")}
              onWaiting={() => setBuffering?.(true)}
              onPlaying={() => setBuffering?.(false)}
              onCanPlay={() => setBuffering?.(false)}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              onEnded={() => setPaused(true)}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onError={() => setVideoError(true)}
            />
            {buffering && !paused ? (
              <div className={TT_COMMUNITY_VIDEO_OVERLAY_L5.videoBuffer} aria-hidden>
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-ref-sun" />
              </div>
            ) : null}
            {paused && !commentsOpen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showChrome?.();
                  togglePlay();
                }}
                className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-black/35 text-white shadow-lg backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun"
                aria-label={t("community_video_play")}
              >
                <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col">
          <div
            className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.overlayCaptionDock} pointer-events-none ${TT_COMMUNITY_VIDEO_OVERLAY_L5.chromeFade} ${
              commentsOpen
                ? "translate-y-full opacity-0"
                : chromeHidden
                  ? TT_COMMUNITY_VIDEO_OVERLAY_L5.chromeHidden
                  : "translate-y-0 opacity-100"
            } ${!showNoVideo && src && !commentsOpen ? "pb-14" : ""}`}
          >
            <CommunityVideoOverlayCaption
              author={current?.author}
              caption={current?.caption}
              expandLabel={t("community_caption_expand")}
              collapseLabel={t("community_caption_collapse")}
            />
          <div className="mt-3 flex flex-wrap gap-2 text-meta text-white/60">
            {itemsLen > 1 && atFirst ? <span>{t("community_video_first")}</span> : null}
            {itemsLen > 1 && atLast && feedLoadingMore ? (
              <span className="text-ref-sun/90">{t("community_load_more")}…</span>
            ) : null}
            {itemsLen > 1 && atLast && !feedLoadingMore ? <span>{t("community_video_last")}</span> : null}
          </div>
          </div>

          {!showNoVideo && src && !commentsOpen ? (
            <div
              className={`pointer-events-auto px-4 ${TT_COMMUNITY_VIDEO_OVERLAY_L5.overlayProgressDock} pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/80 to-transparent pt-2`}
              onPointerDown={() => showChrome?.()}
            >
              <p className="text-end text-meta tabular-nums text-white/80" aria-live="polite">
                {formatCommunityVideoClock(clockCur)} / {formatCommunityVideoClock(clockDur)}
              </p>
              <div
                ref={progressTrackRef}
                role="slider"
                tabIndex={0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label={t("community_video_seek_bar")}
                aria-valuetext={`${formatCommunityVideoClock(clockCur)} / ${formatCommunityVideoClock(clockDur)}`}
                onPointerDown={(e) => {
                  showChrome?.();
                  onProgressPointerDown(e);
                }}
                onKeyDown={onProgressKeyDown}
                className="h-2.5 w-full cursor-pointer touch-none rounded-full bg-white/25 outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              >
                <div className="h-full rounded-full bg-ref-sun/90 motion-sub" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
