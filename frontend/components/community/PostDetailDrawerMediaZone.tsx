"use client";

import type { Dispatch, FormEvent, KeyboardEvent, MutableRefObject, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CommunityPost } from "@/lib/communityMockData";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import { usePostDetailMediaWheel } from "@/components/community/usePostDetailMediaWheel";

function applyI18nPlaceholders(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(val)),
    template,
  );
}

export function PostDetailDrawerMediaZone({
  post,
  t,
  isTextOnlyDetail,
  handleDetailDoubleTapLike,
  showDetailHeart,
  showPostInteractions,
  videoUrl,
  detailVideoError,
  setDetailVideoError,
  videoPoster,
  images,
  carouselIndex,
  setCarouselIndex,
  handleDetailCarouselKeyDown,
  handleDetailMediaKeyDown,
  imageError,
  setImageError,
  currentImage,
  carouselTouchStartX,
  onImageOpen,
  mediaRetryKey = 0,
  onMediaRetry,
  videoFeedIndex = -1,
  videoFeedTotal = 0,
  showVideoFeedNav = false,
  onVideoFeedPrev,
  onVideoFeedNext,
  videoFeedLoadingMore = false,
}: {
  post: CommunityPost;
  t: (key: string) => string;
  isTextOnlyDetail: boolean;
  handleDetailDoubleTapLike: () => void;
  showDetailHeart: boolean;
  showPostInteractions: boolean;
  videoUrl: string | null;
  detailVideoError: boolean;
  setDetailVideoError: (v: boolean) => void;
  videoPoster: string | undefined;
  images: string[];
  carouselIndex: number;
  setCarouselIndex: Dispatch<SetStateAction<number>>;
  handleDetailCarouselKeyDown: (e: KeyboardEvent) => void;
  handleDetailMediaKeyDown?: (e: KeyboardEvent) => void;
  imageError: boolean;
  setImageError: (v: boolean) => void;
  currentImage: string;
  carouselTouchStartX: MutableRefObject<number | null>;
  onImageOpen?: () => void;
  mediaRetryKey?: number;
  onMediaRetry?: () => void;
  videoFeedIndex?: number;
  videoFeedTotal?: number;
  showVideoFeedNav?: boolean;
  onVideoFeedPrev?: () => void;
  onVideoFeedNext?: () => void;
  videoFeedLoadingMore?: boolean;
}) {
  const videoTouchStartY = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mutedHintVisible, setMutedHintVisible] = useState(true);
  const showMediaFailure = (videoUrl && detailVideoError) || imageError || (!videoUrl && !currentImage);
  const multiImage = !videoUrl && images.length > 1;
  const [feedNavHintKey, setFeedNavHintKey] = useState<"community_feed_nav_wheel_hint" | "community_feed_nav_scroll_hint">(
    "community_feed_nav_scroll_hint",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setFeedNavHintKey(mq.matches ? "community_feed_nav_wheel_hint" : "community_feed_nav_scroll_hint");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setMutedHintVisible(true);
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }, [post.id, videoUrl]);

  const goImageNext = useCallback(() => {
    if (images.length <= 1) return;
    setCarouselIndex((i) => (i + 1) % images.length);
  }, [images.length, setCarouselIndex]);

  const goImagePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCarouselIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length, setCarouselIndex]);

  const wheelMode = showVideoFeedNav ? "videoFeed" : multiImage ? "images" : null;
  const mediaStageRef = usePostDetailMediaWheel({
    enabled: wheelMode != null,
    mode: wheelMode,
    onNext: showVideoFeedNav ? () => onVideoFeedNext?.() : goImageNext,
    onPrev: showVideoFeedNav ? () => onVideoFeedPrev?.() : goImagePrev,
  });

  const dismissMutedHint = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = false;
      void el.play().catch(() => {});
    }
    setMutedHintVisible(false);
  }, []);

  const onMediaKeyDown = (e: KeyboardEvent) => {
    handleDetailMediaKeyDown?.(e);
    if (!e.defaultPrevented) handleDetailCarouselKeyDown(e);
  };

  if (isTextOnlyDetail) {
    return (
      <div
        className={`relative min-h-[9rem] shrink-0 ${TT_COMMUNITY_DRAWER_L5.feedCardMediaBorder} ${TT_COMMUNITY_DRAWER_L5.feedCardMediaBg} px-4 py-5 select-none`}
        onDoubleClick={handleDetailDoubleTapLike}
      >
        {showDetailHeart && showPostInteractions ? (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in duration-200" aria-hidden>
            <svg className="h-16 w-16 text-ref-sun drop-shadow-on-dark opacity-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
        ) : null}
        <span className="pointer-events-none inline-block rounded-full border border-ref-sun/40 bg-ink-900/80 px-2.5 py-0.5 text-meta text-ref-sun" aria-hidden>
          {t("community_type_text")}
        </span>
        <p className="mt-3 text-body text-slate-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        {showPostInteractions ? (
          <p className="mt-2 text-meta text-slate-400">{t("community_text_double_tap_hint")}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={mediaStageRef}
        className={TT_COMMUNITY_DRAWER_L5.postDetailMediaStage}
        onDoubleClick={handleDetailDoubleTapLike}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (!touch) return;
          if (showVideoFeedNav) {
            videoTouchStartY.current = touch.clientY;
            carouselTouchStartX.current = multiImage ? touch.clientX : null;
            return;
          }
          if (videoUrl) {
            carouselTouchStartX.current = null;
            return;
          }
          carouselTouchStartX.current = touch.clientX;
        }}
        onTouchEnd={(e) => {
          if (showVideoFeedNav) {
            const startY = videoTouchStartY.current;
            const startX = carouselTouchStartX.current;
            videoTouchStartY.current = null;
            carouselTouchStartX.current = null;
            const endTouch = e.changedTouches[0];
            if (!endTouch) {
              handleDetailDoubleTapLike();
              return;
            }
            const dy = endTouch.clientY - (startY ?? endTouch.clientY);
            const dx = multiImage && startX != null ? endTouch.clientX - startX : 0;
            const threshold = 56;
            if (Math.abs(dy) >= threshold && Math.abs(dy) >= Math.abs(dx)) {
              if (dy < 0) onVideoFeedNext?.();
              else onVideoFeedPrev?.();
              return;
            }
            if (multiImage && images.length > 1 && startX != null && Math.abs(dx) >= 48) {
              const n = images.length;
              if (dx > 0) setCarouselIndex((i) => (i - 1 + n) % n);
              else setCarouselIndex((i) => (i + 1) % n);
              return;
            }
            handleDetailDoubleTapLike();
            return;
          }
          if (videoUrl) {
            carouselTouchStartX.current = null;
            handleDetailDoubleTapLike();
            return;
          }
          const start = carouselTouchStartX.current;
          carouselTouchStartX.current = null;
          if (images.length > 1 && start != null) {
            const endX = e.changedTouches[0]?.clientX;
            if (endX != null) {
              const dx = endX - start;
              const threshold = 48;
              if (Math.abs(dx) >= threshold) {
                const n = images.length;
                if (dx > 0) setCarouselIndex((i) => (i - 1 + n) % n);
                else setCarouselIndex((i) => (i + 1) % n);
                return;
              }
            }
          }
          handleDetailDoubleTapLike();
        }}
        onKeyDown={onMediaKeyDown}
        tabIndex={multiImage || showVideoFeedNav ? 0 : undefined}
        role={multiImage || showVideoFeedNav ? "region" : undefined}
        aria-label={
          multiImage
            ? `${(post.title || post.content || "").slice(0, 30)} · ${t("community_carousel")}`
            : showVideoFeedNav
              ? t(feedNavHintKey)
              : undefined
        }
        aria-roledescription={
          multiImage && showVideoFeedNav
            ? t("community_feed_nav_and_carousel")
            : multiImage
              ? t("community_carousel")
              : showVideoFeedNav
                ? t("community_feed_nav_region")
                : undefined
        }
        aria-keyshortcuts={
          multiImage && showVideoFeedNav
            ? "ArrowUp ArrowDown ArrowLeft ArrowRight Home End"
            : multiImage
              ? "ArrowLeft ArrowRight Home End"
              : showVideoFeedNav
                ? "ArrowUp ArrowDown"
                : undefined
        }
      >
        {multiImage && showVideoFeedNav ? (
          <span className="sr-only">{t("community_feed_nav_and_carousel_hint")}</span>
        ) : multiImage ? (
          <span className="sr-only">{t("community_carousel_keyboard_hint")}</span>
        ) : showVideoFeedNav ? (
          <span className="sr-only">{t(feedNavHintKey)}</span>
        ) : null}
        {showDetailHeart && showPostInteractions ? (
          <span className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none animate-in zoom-in duration-200" aria-hidden>
            <svg className="h-20 w-20 text-white drop-shadow-on-dark opacity-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
        ) : null}

        {videoUrl && !detailVideoError ? (
          <>
            {videoPoster ? (
              <Image
                key={`${post.id}-video-blur-${mediaRetryKey}`}
                src={videoPoster}
                alt=""
                fill
                aria-hidden
                className="pointer-events-none scale-110 object-cover opacity-50 blur-3xl"
                sizes="(max-width: 768px) 100vw, 680px"
                unoptimized={communityMediaNextImageUnoptimized(videoPoster)}
              />
            ) : null}
            <video
              ref={videoRef}
              key={`${post.id}-detail-video-${mediaRetryKey}`}
              src={videoUrl}
              poster={videoPoster}
              controls
              playsInline
              muted
              autoPlay
              preload="metadata"
              className="absolute inset-0 z-[1] h-full w-full object-contain bg-black"
              aria-label={post.title || t("community_video_playing")}
              onLoadedData={(e) => {
                void e.currentTarget.play().catch(() => {});
              }}
              onVolumeChange={(e) => {
                if (!e.currentTarget.muted) setMutedHintVisible(false);
              }}
              onError={() => setDetailVideoError(true)}
            />
            {mutedHintVisible ? (
              <button
                type="button"
                className={TT_COMMUNITY_DRAWER_L5.postDetailVideoMutedHint}
                onClick={dismissMutedHint}
                aria-label={t("community_video_tap_unmute")}
              >
                {t("community_video_muted_autoplay_hint")} · {t("community_video_tap_unmute")}
              </button>
            ) : null}
          </>
        ) : null}

        {!videoUrl && !imageError && currentImage ? (
          <>
            <Image
              key={`${currentImage}-blur-${mediaRetryKey}`}
              src={currentImage}
              alt=""
              fill
              aria-hidden
              className="pointer-events-none scale-110 object-cover opacity-45 blur-3xl"
              sizes="(max-width: 768px) 100vw, 680px"
              loading="eager"
              unoptimized={communityMediaNextImageUnoptimized(currentImage)}
            />
            <button
              type="button"
              className="absolute inset-0 z-[2] cursor-zoom-in"
              aria-label={t("community_view_full")}
              onClick={() => onImageOpen?.()}
            >
              <Image
                key={`${currentImage}-${mediaRetryKey}`}
                src={currentImage}
                alt={(post.title || post.content || "").slice(0, 30)}
                fill
                className={`pointer-events-none object-contain ${TT_COMMUNITY_DRAWER_L5.postDetailCarouselSlide}`}
                sizes="(max-width: 768px) 100vw, 680px"
                loading="eager"
                unoptimized={communityMediaNextImageUnoptimized(currentImage)}
                onError={() => setImageError(true)}
              />
            </button>
          </>
        ) : null}

        {showMediaFailure ? (
          <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center" role="alert">
            <p className="text-small text-slate-300">
              {videoUrl ? t("community_video_load_failed") : t("community_media_load_failed")}
            </p>
            {onMediaRetry ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  onMediaRetry();
                }}
              >
                <button type="submit" className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCyanPillFocus}`}>
                  {t("common_retry")}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        {showVideoFeedNav && videoFeedTotal > 1 && videoFeedIndex >= 0 ? (
          <span className={TT_COMMUNITY_DRAWER_L5.postDetailVideoFeedCounter} aria-live="polite">
            {applyI18nPlaceholders(t("community_feed_post_counter"), {
              current: videoFeedIndex + 1,
              total: videoFeedTotal,
            })}
            {videoFeedLoadingMore ? " · …" : ""}
          </span>
        ) : null}

        {showVideoFeedNav ? (
          <p className={TT_COMMUNITY_DRAWER_L5.postDetailFeedNavHint} aria-hidden>
            {t(feedNavHintKey)}
          </p>
        ) : null}

        {multiImage ? (
          <>
            <span className={TT_COMMUNITY_DRAWER_L5.postDetailImageCounter} aria-live="polite">
              {applyI18nPlaceholders(t("community_post_image_counter"), {
                current: (carouselIndex % images.length) + 1,
                total: images.length,
              })}
            </span>
            <form
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                goImagePrev();
              }}
            >
              <button
                type="submit"
                className={`absolute left-2 top-1/2 z-[6] -translate-y-1/2 ${TT_COMMUNITY_DRAWER_L5.postDetailCarouselNav}`}
                aria-label={t("community_prev_image")}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
            </form>
            <form
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                goImageNext();
              }}
            >
              <button
                type="submit"
                className={`absolute right-2 top-1/2 z-[6] -translate-y-1/2 ${TT_COMMUNITY_DRAWER_L5.postDetailCarouselNav}`}
                aria-label={t("community_next_image")}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                </svg>
              </button>
            </form>
          </>
        ) : null}
      </div>

      {multiImage ? (
        <div className={`${TT_COMMUNITY_DRAWER_L5.postDetailThumbStrip} flex`} role="tablist" aria-label={t("community_carousel")}>
          {images.map((raw, i) => {
            const src = communityMediaAbsoluteUrlForRender(raw);
            const active = i === carouselIndex % images.length;
            return (
              <button
                key={`${raw}-${i}`}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${TT_COMMUNITY_DRAWER_L5.postDetailThumbBtn} ${active ? TT_COMMUNITY_DRAWER_L5.postDetailThumbBtnActive : ""}`}
                onClick={() => setCarouselIndex(i)}
                aria-label={`${i + 1} / ${images.length}`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="40px" unoptimized={communityMediaNextImageUnoptimized(src)} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
