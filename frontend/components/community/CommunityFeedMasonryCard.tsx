"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "@/components/community/CommunityFeedCard";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { useCommunityFeedCardVideoAutoplay } from "@/components/community/CommunityFeedVideoAutoplayContext";
import {
  communityFeedMasonryPrimeVideoPreviewFrame,
} from "@/components/community/communityFeedMasonryMediaDisplay";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaIsStillImageUrl,
  communityMediaPlaybackUrlForRender,
} from "@/lib/communityMediaClientUrl";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";
import { isShowcasePostId } from "@/lib/communityShowcase";
import {
  communityShowcaseEngagementButtonAria,
  communityShowcaseEngagementCountClassName,
} from "@/lib/communityShowcaseEngagementUi";
import { CommunityFeedMasonryLocationPill } from "@/components/community/CommunityFeedMasonryLocationPill";
import { CommunityFeedMasonryMediaFallback } from "@/components/community/CommunityFeedMasonryMediaFallback";
import { CommunityFeedMasonryAdBadge } from "@/components/community/CommunityFeedMasonryAdBadge";
import { communityFeedMasonryCardViewModel } from "@/components/community/communityFeedMasonryCardViewModel";
import { communityFeedSocialCountFormat } from "@/components/community/communityFeedSocialCountFormat";
import { l5CardMediaGradientShellClass } from "@/lib/l5CardMediaPlaceholder";
import { useL5CardMediaThumbReveal } from "@/lib/useL5CardMediaThumbReveal";

export type CommunityFeedMasonryCardProps = {
  post: CommunityPost;
  t: (key: string) => string;
  onViewFull?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onPlayVideo?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onReport?: (post: CommunityPost) => void;
  topicTagHref?: (tag: string) => string;
  authorFollow?: CommunityFeedCardAuthorFollow;
  liked?: boolean;
  collected?: boolean;
  commentCount?: number;
  onLike?: () => void;
  onCollect?: () => void;
  onCommentClick?: (post: CommunityPost, trigger?: HTMLElement) => void;
  testId?: string;
};

/** 美团/小红书式瀑布卡：大图 + 左下定位 pill + 标题 + 作者/赞 */
export function CommunityFeedMasonryCard({
  post,
  t,
  onViewFull,
  onPlayVideo,
  authorFollow: _authorFollow,
  onReport: _onReport,
  topicTagHref: _topicTagHref,
  liked,
  collected,
  commentCount,
  onLike,
  onCollect,
  onCommentClick,
  testId,
}: CommunityFeedMasonryCardProps) {
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

  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [mediaRetryKey, setMediaRetryKey] = useState(0);
  const thumbReveal = useL5CardMediaThumbReveal(thumbSrc);

  const handleMediaRetry = () => {
    if (isVideoPost) {
      setMediaError(false);
      setMediaLoaded(false);
    } else {
      thumbReveal.resetForRetry();
    }
    setMediaRetryKey((k) => k + 1);
  };

  const imageMediaLoaded = isVideoPost ? mediaLoaded : thumbReveal.mediaLoaded;
  const imageMediaError = isVideoPost ? mediaError : thumbReveal.mediaError;
  const imageThumbIsTiny = isVideoPost ? false : thumbReveal.thumbIsTiny;

  const hasRenderableMedia = Boolean(videoSrc || thumbSrc);
  const showEmptyMediaFallback = !isTextOnly && !hasRenderableMedia;

  useEffect(() => {
    if (isVideoPost) {
      setMediaLoaded(false);
      setMediaError(false);
    }
  }, [post.id, videoSrc, isVideoPost]);

  useEffect(() => {
    if (!videoSrc || mediaLoaded || mediaError) return;
    const timer = window.setTimeout(() => setMediaError(true), 14_000);
    return () => window.clearTimeout(timer);
  }, [videoSrc, mediaLoaded, mediaError, mediaRetryKey]);

  const [localLiked, setLocalLiked] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const likeBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressOpenRef = useRef(false);
  const likedState = onLike !== undefined ? (liked ?? false) : localLiked;
  const collectedState = collected ?? false;
  const displayLikes = likedState ? likes + 1 : likes;
  const displayComments = commentCount ?? post.comments;
  const displayCollects = collectedState ? post.collects + 1 : post.collects;
  const engagementCountClass = communityShowcaseEngagementCountClassName(post.id);

  useEffect(
    () => () => {
      if (likeBurstTimerRef.current) clearTimeout(likeBurstTimerRef.current);
    },
    [],
  );

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

  const handleMediaDoubleClick = (e: MouseEvent<HTMLElement>) => {
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

  const showShimmer =
    !isTextOnly &&
    !imageMediaError &&
    !imageThumbIsTiny &&
    !imageMediaLoaded &&
    hasRenderableMedia &&
    !showEmptyMediaFallback &&
    !isVideoPost;
  const showVideoLoading =
    isVideoPost && Boolean(videoSrc) && !mediaLoaded && !mediaError && !showEmptyMediaFallback;
  const mediaAspectClass = isTextOnly
    ? "aspect-[4/5] w-full"
    : `${vm.mediaAspectClass} w-full`;

  return (
    <article
      className={`${TT_COMMUNITY_FEED_ACTION.masonryCardShell} ${TT_COMMUNITY_FEED_L5.masonryShellFocus}`}
      aria-labelledby={`${post.id}-masonry-title`}
      data-testid={testId}
    >
      <div
        role="button"
        tabIndex={0}
        className={`w-full text-left block ${communityCardLinkFocus}`}
        aria-label={displayTitle || t("community_view_full")}
        onClick={(e) => openPreviewFromTarget(e.currentTarget)}
        onKeyDown={handlePreviewKeyDown}
        onDoubleClick={handleMediaDoubleClick}
      >
          <div
            ref={containerRef}
            className={`${TT_COMMUNITY_FEED_ACTION.masonryCardMediaFrame} ${mediaAspectClass}`}
            role={isTextOnly ? undefined : "img"}
            aria-hidden={isTextOnly ? undefined : true}
          >
            {showShimmer ? (
              <div className={TT_COMMUNITY_FEED_ACTION.masonryCardMediaShimmer} aria-hidden />
            ) : null}

            {showVideoLoading ? (
              <CommunityFeedMasonryMediaFallback t={t} isVideo postType={post.type} loading />
            ) : null}

            {imageMediaError && !isTextOnly ? (
              <CommunityFeedMasonryMediaFallback
                t={t}
                isVideo={isVideoPost}
                postType={post.type}
                onRetry={handleMediaRetry}
                fallbackSeed={post.id}
              />
            ) : null}

            {imageThumbIsTiny && !imageMediaError && !isTextOnly ? (
              <CommunityFeedMasonryMediaFallback
                t={t}
                isVideo={isVideoPost}
                postType={post.type}
                fallbackSeed={post.id}
              />
            ) : null}

            {showEmptyMediaFallback ? (
              <CommunityFeedMasonryMediaFallback
                t={t}
                isVideo={isVideoPost}
                postType={post.type}
                fallbackSeed={post.id}
              />
            ) : null}

            {!imageMediaError && !imageThumbIsTiny && !showEmptyMediaFallback && (
              <div
                className={`${TT_COMMUNITY_FEED_ACTION.masonryCardMediaInner} ${TT_COMMUNITY_FEED_L5.masonryMediaReveal} ${
                  showVideoLoading ? "opacity-0" : ""
                }`}
                data-media-loaded={imageMediaLoaded || isTextOnly ? "true" : "false"}
              >
                {videoSrc ? (
                  <>
                    <video
                      key={`${post.id}-video-${mediaRetryKey}`}
                      ref={videoRef}
                      data-testid="community-feed-masonry-video"
                      src={videoSrc}
                      poster={posterSrc}
                      className="absolute inset-0 h-full w-full object-cover"
                      muted
                      playsInline
                      loop
                      preload="auto"
                      aria-label={displayTitle.slice(0, 40)}
                      onLoadedMetadata={(e) => {
                        if (!posterSrc) {
                          communityFeedMasonryPrimeVideoPreviewFrame(e.currentTarget);
                        }
                      }}
                      onLoadedData={() => setMediaLoaded(true)}
                      onSeeked={() => setMediaLoaded(true)}
                      onCanPlay={() => setMediaLoaded(true)}
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
                ) : thumbSrc ? (
                  <>
                    <div
                      aria-hidden
                      className={`absolute inset-0 ${l5CardMediaGradientShellClass(post.id)}`}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny 烟测图须 native onLoad naturalWidth */}
                    <img
                      key={`${post.id}-img-${mediaRetryKey}`}
                      ref={thumbReveal.imgRef}
                      src={thumbReveal.displaySrc}
                      alt={displayTitle.slice(0, 40)}
                      className={`absolute inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-200 ${
                        thumbReveal.mediaLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      loading="lazy"
                      decoding="async"
                      onLoad={thumbReveal.onLoad}
                      onError={thumbReveal.onError}
                    />
                  </>
                ) : isTextOnly ? (
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink-900 via-ink-800/95 to-ink-800/80 p-3">
                    <span className="mb-1 text-[0.65rem] font-medium text-ref-sun">
                      {t("community_type_text")}
                    </span>
                    <p className="line-clamp-6 whitespace-pre-wrap text-[0.7rem] leading-snug text-slate-300">
                      {(post.content || post.title || t("ui_em_dash")).slice(0, 200)}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {vm.isSponsored && !isTextOnly ? (
              <CommunityFeedMasonryAdBadge label={t("community_feed_ad_badge")} />
            ) : null}

            {isShowcasePostId(post.id) ? (
              <span className={TT_COMMUNITY_FEED_L5.masonryShowcaseBadge}>{t("community_feed_showcase_badge")}</span>
            ) : null}

            {vm.location && !imageMediaError && !isTextOnly && !showEmptyMediaFallback ? (
              <CommunityFeedMasonryLocationPill
                location={vm.location}
                approxHint={t("community_feed_distance_approx_hint")}
              />
            ) : null}

            {!vm.location && !isTextOnly && !imageMediaError && !showEmptyMediaFallback ? (
              <div className={TT_COMMUNITY_FEED_ACTION.masonryMediaOverlay} aria-hidden />
            ) : null}

            {isVideoPost && !mediaError && !isAutoplayActive ? (
              <>
                <span className={TT_COMMUNITY_FEED_ACTION.masonryCardPlayBadge} aria-hidden>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className={TT_COMMUNITY_FEED_L5.masonryCardPlayCenter} aria-hidden>
                  <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </>
            ) : isVideoPost && !mediaError && isAutoplayActive ? (
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
            <p id={`${post.id}-masonry-title`} className={TT_COMMUNITY_FEED_ACTION.masonryCardTitle}>
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
        <div className="flex shrink-0 items-center gap-0.5">
          {onCommentClick ? (
            <button
              type="button"
              className={TT_COMMUNITY_FEED_L5.masonryStatBtn}
              aria-label={communityShowcaseEngagementButtonAria(t, "community_comment", displayComments, post.id)}
              onClick={(e) => {
                e.stopPropagation();
                onCommentClick(post, e.currentTarget);
              }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {displayComments > 0 ? (
                <span className={`${TT_COMMUNITY_FEED_L5.masonryStatCount} ${engagementCountClass}`}>
                  {communityFeedSocialCountFormat(displayComments)}
                </span>
              ) : null}
            </button>
          ) : null}
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
              <span className={`${TT_COMMUNITY_FEED_L5.masonryLikeCount} ${engagementCountClass}`}>
                {communityFeedSocialCountFormat(displayLikes)}
              </span>
            ) : (
              <span className={TT_COMMUNITY_FEED_L5.masonryLikeLabel}>{t("community_feed_like_label")}</span>
            )}
          </button>
        </form>
          {onCollect ? (
            <form
              className="inline shrink-0"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                onCollect();
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="submit"
                className={`${TT_COMMUNITY_FEED_L5.masonryStatBtn} ${collectedState ? TT_COMMUNITY_FEED_L5.masonryStatBtnActive : ""}`}
                aria-label={communityShowcaseEngagementButtonAria(t, "community_collect", displayCollects, post.id)}
                aria-pressed={collectedState ? true : undefined}
              >
                <svg className="h-3.5 w-3.5" fill={collectedState ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {displayCollects > 0 ? (
                  <span className={`${TT_COMMUNITY_FEED_L5.masonryStatCount} ${engagementCountClass}`}>
                    {communityFeedSocialCountFormat(displayCollects)}
                  </span>
                ) : null}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}
