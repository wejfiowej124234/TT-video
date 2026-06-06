"use client";

import { useState, useRef, useMemo, useEffect, type FormEvent } from "react";
import Image from "next/image";
import type { CommunityPost } from "@/lib/communityMockData";
import { communityPublishFabFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaIsStillImageUrl,
  communityMediaNextImageUnoptimized,
  communityMediaPlaybackUrlForRender,
} from "@/lib/communityMediaClientUrl";
import {
  resolveCommunityPostPlayableVideoUrl,
} from "@/components/community/communityFeedMappersRoleAndMedia";
import {
  useCommunityFeedCardVideoAutoplay,
} from "@/components/community/CommunityFeedVideoAutoplayContext";

export type CommunityFeedCardMediaProps = {
  post: CommunityPost;
  images: string[];
  is_video: boolean;
  type: string;
  t: (key: string) => string;
  onDoubleTapLike: () => void;
  onPlayVideo?: (post: CommunityPost, trigger?: HTMLElement) => void;
};

/** Feed 卡片媒体区：轮播/单图/视频 + 双赞 + 类型标签；从 CommunityFeedCard 拆出 */
export default function CommunityFeedCardMedia({
  post,
  images,
  is_video,
  type,
  t,
  onDoubleTapLike,
  onPlayVideo,
}: CommunityFeedCardMediaProps) {
  const dash = t("ui_em_dash");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [videoInlineError, setVideoInlineError] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const carouselTouchStartX = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playableRaw = useMemo(() => resolveCommunityPostPlayableVideoUrl(post) ?? "", [post]);
  const playableSrc = useMemo(
    () => (playableRaw ? communityMediaPlaybackUrlForRender(playableRaw) : ""),
    [playableRaw],
  );
  const inlineVideoMode = is_video && playableSrc.length > 0 && !videoInlineError;
  const { containerRef: autoplayContainerRef, isAutoplayActive } = useCommunityFeedCardVideoAutoplay(
    post.id,
    videoRef,
    inlineVideoMode,
  );

  useEffect(() => {
    setVideoInlineError(false);
  }, [post.id, playableSrc]);

  const currentImage = images.length > 0 ? images[carouselIndex % images.length] : "";
  const coverStill = post.cover_url?.trim() || "";
  const displayStill = is_video && coverStill ? coverStill : currentImage;
  const displayStillSrc = displayStill ? communityMediaAbsoluteUrlForRender(displayStill) : "";
  const videoPosterSrc =
    displayStillSrc && communityMediaIsStillImageUrl(displayStillSrc) ? displayStillSrc : undefined;
  const showImage = !imageError;

  const handleDoubleTapLike = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      onDoubleTapLike();
    }
    lastTapRef.current = now;
  };

  const handleCarouselKeyDown = (e: React.KeyboardEvent) => {
    if (images.length <= 1) return;
    const n = images.length;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCarouselIndex((i) => (i - 1 + n) % n);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setCarouselIndex((i) => (i + 1) % n);
    } else if (e.key === "Home") {
      e.preventDefault();
      setCarouselIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setCarouselIndex(n - 1);
    }
  };

  const onCarouselTouchStart = (e: React.TouchEvent) => {
    carouselTouchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onCarouselTouchEnd = (e: React.TouchEvent) => {
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
    handleDoubleTapLike();
  };

  const { title, content } = post;
  const ariaLabel = (title || content || "").slice(0, 30);
  const isTextOnly = type === "text" && images.length === 0;

  if (isTextOnly) {
    return (
      <div
        className={`relative min-h-[5.5rem] select-none ${TT_COMMUNITY_DRAWER_L5.feedCardMediaBorder} ${TT_COMMUNITY_DRAWER_L5.feedCardMediaBg} px-4 py-3 ${TT_COMMUNITY_DRAWER_L5.feedCardMediaFocus}`}
        onDoubleClick={handleDoubleTapLike}
        role="region"
        aria-label={ariaLabel}
      >
        {showHeart && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in duration-200" aria-hidden>
            <svg className="h-16 w-16 text-ref-coral drop-shadow-on-dark opacity-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
        )}
        <span className={`pointer-events-none absolute top-2 left-2 ${TT_COMMUNITY_DRAWER_L5.feedCardTypeBadge}`} aria-hidden>
          {t("community_type_text")}
        </span>
        <p className="mt-8 text-small text-slate-300 line-clamp-4 whitespace-pre-wrap">{content || title || dash}</p>
        <p className="mt-2 text-meta text-slate-400">{t("community_text_double_tap_hint")}</p>
      </div>
    );
  }

  const multiImage = images.length > 1;

  return (
    <div
      ref={autoplayContainerRef}
      className={`relative aspect-[4/3] select-none touch-pan-y ${TT_COMMUNITY_DRAWER_L5.feedCardMediaPlaceholder} ${TT_COMMUNITY_DRAWER_L5.feedCardMediaFocus}`}
      onTouchStart={onCarouselTouchStart}
      onTouchEnd={onCarouselTouchEnd}
      onDoubleClick={handleDoubleTapLike}
      onKeyDown={handleCarouselKeyDown}
      tabIndex={multiImage ? 0 : undefined}
      role={multiImage ? "region" : "img"}
      aria-label={multiImage ? `${ariaLabel} · ${t("community_carousel")}` : ariaLabel}
      aria-roledescription={multiImage ? t("community_carousel") : undefined}
      aria-keyshortcuts={multiImage ? "ArrowLeft ArrowRight Home End" : undefined}
    >
      {multiImage ? (
        <span className="sr-only">{t("community_carousel_keyboard_hint")}</span>
      ) : null}
      {showHeart && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in duration-200" aria-hidden>
          <svg className="h-20 w-20 text-white drop-shadow-on-dark opacity-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </span>
      )}
      {inlineVideoMode ? (
        <>
          <video
            ref={videoRef}
            data-testid="community-feed-inline-video"
            src={playableSrc}
            poster={videoPosterSrc}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            loop
            preload="metadata"
            aria-label={ariaLabel}
            onError={() => setVideoInlineError(true)}
          />
          {isAutoplayActive ? (
            <span className="pointer-events-none absolute left-2 bottom-2 rounded-[var(--radius-sm)] bg-black/55 px-1.5 py-0.5 text-[0.65rem] text-white/90" aria-hidden>
              {t("community_video_muted_autoplay_hint")}
            </span>
          ) : null}
        </>
      ) : displayStillSrc ? (
        <Image
          src={displayStillSrc}
          alt={ariaLabel}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="lazy"
          unoptimized={communityMediaNextImageUnoptimized(displayStillSrc) || displayStillSrc.startsWith("blob:")}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-small" role="img" aria-label={t("community_media_load_failed")}>
          {t("community_media_load_failed")}
        </div>
      )}
      {images.length > 1 && (
        <>
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setCarouselIndex((i) => (i - 1 + images.length) % images.length);
            }}
          >
            <button
              type="submit"
              className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-black/70 motion-sub ${communityPublishFabFocus}`}
              aria-label={t("community_prev_image")}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
            </button>
          </form>
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setCarouselIndex((i) => (i + 1) % images.length);
            }}
          >
            <button
              type="submit"
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-black/70 motion-sub ${communityPublishFabFocus}`}
              aria-label={t("community_next_image")}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" /></svg>
            </button>
          </form>
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden>
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all motion-sub ${i === carouselIndex % images.length ? TT_COMMUNITY_DRAWER_L5.feedCardCarouselDotActive : TT_COMMUNITY_DRAWER_L5.feedCardCarouselDotIdle}`}
              />
            ))}
          </div>
        </>
      )}
      {is_video && onPlayVideo && !inlineVideoMode && (
        <>
          <div className="absolute inset-0 bg-black/30 pointer-events-none" aria-hidden />
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
              if (sub) onPlayVideo(post, sub);
            }}
          >
            <button
              type="submit"
              className={`absolute left-1/2 top-1/2 z-10 flex min-h-[44px] min-w-[44px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-white/20 p-4 text-white shadow-medium hover:bg-white/30 motion-sub ${communityPublishFabFocus}`}
              aria-label={t("community_view_full")}
            >
              <svg className="h-8 w-8 ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </form>
        </>
      )}
      {is_video && (
        <span className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white/90" aria-hidden>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </span>
      )}
      <span className={`pointer-events-none absolute top-2 left-2 ${TT_COMMUNITY_DRAWER_L5.feedCardTypeBadge}`} aria-hidden>
        {t(`community_type_${type}`)}
      </span>
    </div>
  );
}
