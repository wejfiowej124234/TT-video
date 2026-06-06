"use client";

import { useMemo, useState, useRef, type FormEvent, type KeyboardEvent, type MouseEvent, type TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { CommunityFeedMasonryLocationPill } from "@/components/community/CommunityFeedMasonryLocationPill";
import { CommunityFeedMasonryMediaFallback } from "@/components/community/CommunityFeedMasonryMediaFallback";
import { CommunityFeedMasonryAdBadge } from "@/components/community/CommunityFeedMasonryAdBadge";
import { communityFeedMasonryCardViewModel } from "@/components/community/communityFeedMasonryCardViewModel";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaIsStillImageUrl,
  communityMediaNextImageUnoptimized,
  communityMediaPlaybackUrlForRender,
} from "@/lib/communityMediaClientUrl";
import { useCommunityFeedCardVideoAutoplay } from "@/components/community/CommunityFeedVideoAutoplayContext";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";
import { isShowcasePostId } from "@/lib/communityShowcase";
import {
  communityShowcaseEngagementButtonAria,
  communityShowcaseEngagementCountClassName,
} from "@/lib/communityShowcaseEngagementUi";
import { warmCommunityPostDetailDrawer } from "@/lib/communityDrawerPrefetch";

/** 三列紧凑网格 · 美团式 L5（定位 pill + 标题 + 作者/赞） */
export function CommunityFeedCardCompact({
  post,
  t,
  onViewFull,
  onPlayVideo,
  liked: controlledLiked,
  onLike,
}: {
  post: CommunityPost;
  commentCount?: number;
  t: (key: string) => string;
  onViewFull?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onPlayVideo?: (post: CommunityPost, trigger?: HTMLElement) => void;
  liked?: boolean;
  onLike?: () => void;
  onReport?: (post: CommunityPost) => void;
  topicTagHref?: (tag: string) => string;
  authorFollow?: unknown;
}) {
  const vm = useMemo(() => communityFeedMasonryCardViewModel(post, t), [post, t]);
  const videoSrc = vm.videoSrc ? communityMediaPlaybackUrlForRender(vm.videoSrc) : "";
  const thumbSrc = vm.thumbSrc ? communityMediaAbsoluteUrlForRender(vm.thumbSrc) : "";
  const posterSrc =
    thumbSrc && communityMediaIsStillImageUrl(thumbSrc) ? thumbSrc : undefined;
  const displayTitle = vm.displayTitle;
  const isVideoPost = vm.isVideoPost;
  const isTextOnly = vm.isTextOnly;
  const { author } = post;
  const likes = vm.likeCountBase;

  const videoRef = useRef<HTMLVideoElement>(null);
  const { containerRef, isAutoplayActive } = useCommunityFeedCardVideoAutoplay(
    post.id,
    videoRef,
    Boolean(videoSrc),
  );

  const [localLiked, setLocalLiked] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [mediaRetryKey, setMediaRetryKey] = useState(0);
  const likeBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressOpenRef = useRef(false);
  const likedState = onLike !== undefined ? (controlledLiked ?? false) : localLiked;
  const displayLikes = likedState ? likes + 1 : likes;
  const engagementCountClass = communityShowcaseEngagementCountClassName(post.id);

  const triggerLikeBurst = () => {
    if (likeBurstTimerRef.current) clearTimeout(likeBurstTimerRef.current);
    setLikeBurst(true);
    likeBurstTimerRef.current = setTimeout(() => {
      setLikeBurst(false);
      likeBurstTimerRef.current = null;
    }, 650);
  };

  const handleLikeAction = () => {
    if (onLike) {
      if (!likedState) onLike();
    } else if (!likedState) {
      setLocalLiked(true);
    }
    triggerLikeBurst();
  };

  const handleMediaDoubleClick = (e: MouseEvent<HTMLElement> | TouchEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    suppressOpenRef.current = true;
    window.setTimeout(() => {
      suppressOpenRef.current = false;
    }, 320);
    handleLikeAction();
  };

  const openPreviewFromTarget = (target: HTMLElement) => {
    if (suppressOpenRef.current) return;
    openFromPreview(target);
  };

  const handlePreviewKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    openPreviewFromTarget(e.currentTarget);
  };

  const openFromPreview = (submitter: HTMLElement | null) => {
    if (suppressOpenRef.current) return;
    const openDetail = onViewFull ?? onPlayVideo;
    if (openDetail && submitter) openDetail(post, submitter);
  };

  const mediaAspectClass = isTextOnly
    ? "aspect-[4/5] w-full"
    : `${vm.mediaAspectClass} w-full`;
  const hasRenderableMedia = Boolean(videoSrc || thumbSrc);
  const showEmptyMediaFallback = !isTextOnly && !hasRenderableMedia;

  const handleMediaRetry = () => {
    setMediaError(false);
    setMediaRetryKey((k) => k + 1);
  };

  return (
    <article
      className={`${TT_COMMUNITY_FEED_ACTION.masonryCardShell} ${TT_COMMUNITY_FEED_L5.masonryShellFocus}`}
      aria-labelledby={`${post.id}-compact-title`}
      onPointerEnter={warmCommunityPostDetailDrawer}
    >
      <div
        role="button"
        tabIndex={0}
        className={`w-full text-left block ${communityCardLinkFocus}`}
        aria-label={displayTitle || t("community_view_full")}
        onClick={(e) => openPreviewFromTarget(e.currentTarget)}
        onKeyDown={handlePreviewKeyDown}
        onDoubleClick={handleMediaDoubleClick}
        onTouchEnd={handleMediaDoubleClick}
      >
          <div
            ref={containerRef}
            className={`${TT_COMMUNITY_FEED_ACTION.masonryCardMediaFrame} ${mediaAspectClass}`}
            role={isTextOnly ? undefined : "img"}
            aria-hidden={isTextOnly ? undefined : true}
          >
            {mediaError && !isTextOnly ? (
              <CommunityFeedMasonryMediaFallback
                t={t}
                isVideo={isVideoPost}
                postType={post.type}
                onRetry={handleMediaRetry}
              />
            ) : null}

            {showEmptyMediaFallback ? (
              <CommunityFeedMasonryMediaFallback t={t} isVideo={isVideoPost} postType={post.type} />
            ) : null}

            {!mediaError && !showEmptyMediaFallback && videoSrc ? (
              <>
                <video
                  key={`${post.id}-compact-video-${mediaRetryKey}`}
                  ref={videoRef}
                  data-testid="community-feed-compact-video"
                  src={videoSrc}
                  poster={posterSrc}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  aria-label={displayTitle.slice(0, 40)}
                  onError={() => {
                    setMediaError(true);
                    videoRef.current?.pause();
                  }}
                />
                {isAutoplayActive ? (
                  <span className={TT_COMMUNITY_FEED_L5.masonryVideoAutoplayBadge} aria-hidden>
                    {t("community_video_muted_autoplay_hint")}
                  </span>
                ) : null}
              </>
            ) : !mediaError && !showEmptyMediaFallback && thumbSrc ? (
              <Image
                key={`${post.id}-compact-img-${mediaRetryKey}`}
                src={thumbSrc}
                alt={displayTitle.slice(0, 40)}
                fill
                className="object-cover"
                sizes="33vw"
                loading="lazy"
                unoptimized={communityMediaNextImageUnoptimized(thumbSrc) || thumbSrc.startsWith("blob:")}
                onError={() => setMediaError(true)}
              />
            ) : isTextOnly ? (
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink-900 via-ink-800/95 to-ink-800/80 p-2">
                <span className="mb-1 text-[0.65rem] font-medium text-ref-sun">{t("community_type_text")}</span>
                <p className="line-clamp-4 whitespace-pre-wrap text-[0.68rem] leading-snug text-slate-300">
                  {(post.content || post.title || t("ui_em_dash")).slice(0, 160)}
                </p>
              </div>
            ) : null}

            {vm.isSponsored && !isTextOnly ? (
              <CommunityFeedMasonryAdBadge label={t("community_feed_ad_badge")} />
            ) : null}

            {isShowcasePostId(post.id) ? (
              <span className={TT_COMMUNITY_FEED_L5.masonryShowcaseBadge}>{t("community_feed_showcase_badge")}</span>
            ) : null}

            {vm.location && !isTextOnly && !showEmptyMediaFallback ? (
              <CommunityFeedMasonryLocationPill
                location={vm.location}
                approxHint={t("community_feed_distance_approx_hint")}
              />
            ) : null}

            {!vm.location && !isTextOnly && !showEmptyMediaFallback ? (
              <div className={TT_COMMUNITY_FEED_ACTION.masonryMediaOverlay} aria-hidden />
            ) : null}

            {isVideoPost && !isAutoplayActive ? (
              <span className={TT_COMMUNITY_FEED_ACTION.masonryCardPlayBadge} aria-hidden>
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            ) : null}

            {likeBurst ? (
              <span className={TT_COMMUNITY_FEED_L5.masonryLikeBurst} aria-hidden>
                <svg className={TT_COMMUNITY_FEED_L5.masonryLikeBurstIcon} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
            ) : null}
          </div>

          <div className={TT_COMMUNITY_FEED_L5.masonryCardBody}>
            <p id={`${post.id}-compact-title`} className={TT_COMMUNITY_FEED_ACTION.masonryCardTitle}>
              {displayTitle}
            </p>
            {vm.commerceListingHref ? (
              <Link
                href={vm.commerceListingHref}
                className={`mt-0.5 inline-flex min-h-[36px] items-center text-[0.62rem] font-medium text-ref-sun/85 motion-sub hover:text-ref-sun ${communityCardLinkFocus}`}
                onClick={(e) => e.stopPropagation()}
              >
                {t("community_feed_commerce_cta")}
              </Link>
            ) : null}
          </div>
      </div>

      <div className={`${TT_COMMUNITY_FEED_ACTION.masonryCardFooter} ${TT_COMMUNITY_FEED_L5.masonryCardBody}`}>
        <Link
          href={author?.id ? `/community/user/${author.id}` : "/community"}
          className={`flex min-h-[44px] min-w-0 flex-1 items-center gap-1.5 py-0.5 motion-sub hover:text-ref-sun/95 ${communityCardLinkFocus}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={author?.nickname ?? ""}
        >
          {author?.avatar_url ? (
            <span className="relative h-[18px] w-[18px] shrink-0 overflow-hidden rounded-full">
              <Image src={author.avatar_url} alt="" fill className="object-cover" sizes="18px" unoptimized />
            </span>
          ) : (
            <span
              className={`h-[18px] w-[18px] shrink-0 rounded-full ${TT_COMMUNITY_DRAWER_L5.avatarFallback}`}
              aria-hidden
            />
          )}
          <span className="truncate text-[0.68rem] text-slate-400">{vm.authorNickname}</span>
        </Link>
        <form
          className="inline shrink-0"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            handleLikeAction();
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="submit"
            className={`${TT_COMMUNITY_FEED_L5.masonryLikeBtn} ${likedState ? TT_COMMUNITY_FEED_L5.masonryLikeBtnActive : ""}`}
            aria-label={communityShowcaseEngagementButtonAria(t, "community_like", displayLikes, post.id)}
            aria-pressed={likedState ? true : undefined}
          >
            <svg
              className={`h-3.5 w-3.5 shrink-0 ${likedState ? "fill-ref-sun/80 text-ref-sun/80" : ""}`}
              fill={likedState ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {displayLikes > 0 ? (
              <span className={`${TT_COMMUNITY_FEED_L5.masonryLikeCount} ${engagementCountClass}`}>{displayLikes}</span>
            ) : (
              <span className={TT_COMMUNITY_FEED_L5.masonryLikeLabel}>{t("community_feed_like_label")}</span>
            )}
          </button>
        </form>
      </div>
    </article>
  );
}
