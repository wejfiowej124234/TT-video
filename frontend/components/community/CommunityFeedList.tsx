"use client";

import { useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import type { CommunityComment } from "@/lib/communityMockData";
import { FeedSkeleton, FeedGridSkeleton } from "./FeedSkeleton";
import {
  communityCardLinkFocus,
  communityShellTabFocus,
} from "@/lib/communityA11yFocus";
import { CommunityFeedMasonryGrid } from "@/components/community/CommunityFeedMasonryGrid";
import { CommunityFeedEmptyFooter } from "@/components/community/CommunityFeedEmptyFooter";
import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_PAGE_L5, TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

export interface CommunityFeedListProps {
  t: (key: string) => string;
  feedLoading: boolean;
  isEmpty: boolean;
  isEmptySearch: boolean;
  feedTab: "recommend" | "following";
  isLoggedIn: boolean;
  postsToShow: CommunityPost[];
  localCommentsByPostId: Record<string, CommunityComment[]>;
  hasMore: boolean;
  feedLoadingMore: boolean;
  tagFilter: string | null;
  setTagFilter: (v: string | null) => void;
  setFeedTab: (v: "recommend" | "following") => void;
  setSearchQuery: (v: string) => void;
  likedPostIds?: Set<string>;
  collectedPostIds?: Set<string>;
  onLike?: (postId: string) => void;
  onCollect?: (postId: string) => void;
  onLoadMore: () => void;
  onViewFull: (post: CommunityPost, trigger?: HTMLElement | null) => void;
  onCommentClick: (post: CommunityPost, trigger?: HTMLElement | null) => void;
  onPlayVideo: ((post: CommunityPost, trigger?: HTMLElement | null) => void) | undefined;
  onReport: (post: CommunityPost) => void;
  /** 空列表「发帖」：传入 `SubmitEvent.submitter` 以恢复焦点 */
  onPublishClick: (trigger?: HTMLElement | null) => void;
  /** 大屏单列卡：与 `getMeFollowing` + follow API 对齐（04 §3.4） */
  meUserId?: string | null;
  followingAuthorIds?: ReadonlySet<string>;
  followBusyAuthorId?: string | null;
  onAuthorFollowToggle?: (authorId: string) => void;
  /** 31 §2.1：话题筛选时展示当前列表匹配总数（与 searchFilteredPosts 一致） */
  tagTopicMatchCount?: number;
  /** B-077：紧凑卡话题链与 Feed `sort=` 一致 */
  topicTagHref?: (tag: string) => string;
  /** 推荐流排序（瀑布 promo 插槽显隐） */
  sortBy?: "latest" | "hot";
  hotDestinations?: readonly string[];
  proximityFilter?: "none" | "nearby" | "nearby_1km";
  setProximityFilter?: (v: "none" | "nearby" | "nearby_1km") => void;
}

/** 信息流：骨架 / 空态 / 瀑布 masonry（推荐+关注）/ 加载更多 */
export default function CommunityFeedList({
  t,
  feedLoading,
  isEmpty,
  isEmptySearch,
  feedTab,
  isLoggedIn: _isLoggedIn,
  postsToShow,
  localCommentsByPostId,
  hasMore,
  feedLoadingMore,
  tagFilter,
  setTagFilter,
  setFeedTab,
  setSearchQuery,
  likedPostIds,
  collectedPostIds,
  onLike,
  onCollect,
  onLoadMore,
  onViewFull,
  onCommentClick,
  onPlayVideo,
  onReport,
  onPublishClick,
  meUserId,
  followingAuthorIds,
  followBusyAuthorId,
  onAuthorFollowToggle,
  tagTopicMatchCount,
  topicTagHref,
  sortBy = "latest",
  hotDestinations = [],
  proximityFilter = "none",
  setProximityFilter,
}: CommunityFeedListProps) {
  const loadSentinelRef = useRef<HTMLDivElement>(null);
  const isEmptyProximity =
    !isEmptySearch &&
    feedTab !== "following" &&
    proximityFilter !== "none" &&
    typeof setProximityFilter === "function";
  const emptyTitle = isEmptySearch
    ? t("community_search_empty")
    : isEmptyProximity
      ? proximityFilter === "nearby_1km"
        ? t("community_proximity_1km_empty")
        : t("community_proximity_nearby_empty")
      : feedTab === "following"
        ? t("community_following_empty")
        : t("community_empty");
  const emptyAria = isEmptySearch
    ? t("community_search_placeholder")
    : isEmptyProximity
      ? emptyTitle
      : feedTab === "following"
        ? t("community_following_empty")
        : t("community_empty");
  const showPromoSlots =
    feedTab === "recommend" && sortBy === "latest" && !tagFilter && !isEmpty && proximityFilter === "none";

  /** 31 §3.2：触底（或接近底部）自动加载；与按钮共用 onLoadMore，由 hook 内防重入 */
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (!hasMore || feedLoading) return;
    const node = loadSentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) onLoadMore();
      },
      { root: null, rootMargin: "280px 0px 0px 0px", threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, feedLoading, feedLoadingMore, onLoadMore]);

  return (
    <div className={`${TT_COMMUNITY_FEED_ACTION.feedListAfterFilters} space-y-3 pb-24 safe-area-pb`}>
      {feedLoading ? (
        <>
          <div className="md:hidden">
            <FeedGridSkeleton t={t} />
          </div>
          <div className="hidden md:block">
            <FeedSkeleton count={3} t={t} />
          </div>
        </>
      ) : isEmpty ? (
        <section
          className={TT_COMMUNITY_FEED_ACTION.emptyPanel}
          aria-label={emptyAria}
        >
          <p className={TT_COMMUNITY_FEED_ACTION.emptyTitle}>{emptyTitle}</p>
          {!isEmptySearch && !isEmptyProximity && feedTab !== "following" ? (
            <p className={TT_COMMUNITY_FEED_ACTION.emptyHint}>{t("community_empty_hint")}</p>
          ) : null}
          {isEmptyProximity ? (
            <div className={TT_COMMUNITY_FEED_ACTION.emptyActions}>
              <p className={TT_COMMUNITY_FEED_ACTION.emptyHint}>{t("community_proximity_empty_hint")}</p>
              <div className="flex flex-wrap justify-center gap-3">
                {proximityFilter === "nearby_1km" ? (
                  <form
                    className="inline"
                    onSubmit={(e: FormEvent<HTMLFormElement>) => {
                      e.preventDefault();
                      setProximityFilter!("nearby");
                    }}
                  >
                    <button
                      type="submit"
                      className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
                    >
                      {t("community_proximity_empty_widen")}
                    </button>
                  </form>
                ) : null}
                <form
                  className="inline"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    setProximityFilter!("none");
                  }}
                >
                  <button
                    type="submit"
                    className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
                  >
                    {t("community_proximity_empty_clear")}
                  </button>
                </form>
                <Link
                  href="/community/explore"
                  className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCardLinkFocus}`}
                >
                  {t("community_explore_title")}
                </Link>
              </div>
              <CommunityFeedEmptyFooter t={t} showGuidelines={false} />
            </div>
          ) : isEmptySearch ? (
            <div className={TT_COMMUNITY_FEED_ACTION.emptyActions}>
              <form
                className="inline"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  setSearchQuery("");
                }}
              >
                <button
                  type="submit"
                  className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
                >
                  {t("community_search_clear")}
                </button>
              </form>
              <CommunityFeedEmptyFooter t={t} showGuidelines={false} />
            </div>
          ) : feedTab === "following" ? (
            <div className={TT_COMMUNITY_FEED_ACTION.emptyActions}>
              <div className="flex flex-wrap justify-center gap-3">
                <form
                  className="inline"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    setFeedTab("recommend");
                  }}
                >
                  <button
                    type="submit"
                    className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
                  >
                    {t("community_following_see_recommend")}
                  </button>
                </form>
                <Link
                  href="/community/friends"
                  className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCardLinkFocus}`}
                >
                  {t("community_following_follow_more")}
                </Link>
              </div>
              <CommunityFeedEmptyFooter t={t} />
            </div>
          ) : (
            <div className={TT_COMMUNITY_FEED_ACTION.emptyActions}>
              <div className={TT_COMMUNITY_FEED_ACTION.emptyIconWrap} aria-hidden>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
                  onPublishClick(sub);
                }}
              >
                <button
                  type="submit"
                  className={`${TT_COMMUNITY_FEED_ACTION.emptyPrimaryCta} ${communityCardLinkFocus}`}
                >
                  {t("community_empty_cta")}
                </button>
              </form>
              <CommunityFeedEmptyFooter t={t} />
            </div>
          )}
        </section>
      ) : (
        <>
          {tagFilter && (
            <div className="flex flex-wrap items-center gap-2 mb-2 text-meta text-ref-sun/90">
              <span className="font-medium text-ref-sun">#{tagFilter}</span>
              {typeof tagTopicMatchCount === "number" ? (
                <span className="text-slate-400">
                  {t("community_tag_topic_count").replace("{{count}}", String(tagTopicMatchCount))}
                </span>
              ) : null}
              <form
                className="inline"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  setTagFilter(null);
                }}
              >
                <button
                  type="submit"
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/40 text-body font-medium text-ref-sun hover:bg-ref-sun/12 ${communityShellTabFocus}`}
                  aria-label={t("community_tag_clear_filter")}
                >
                  ×
                </button>
              </form>
            </div>
          )}
          <CommunityFeedMasonryGrid
            t={t}
            postsToShow={postsToShow}
            localCommentsByPostId={localCommentsByPostId}
            likedPostIds={likedPostIds}
            collectedPostIds={collectedPostIds}
            onLike={onLike}
            onCollect={onCollect}
            onCommentClick={onCommentClick}
            onViewFull={onViewFull}
            onPlayVideo={onPlayVideo}
            onReport={onReport}
            topicTagHref={topicTagHref}
            meUserId={meUserId}
            followingAuthorIds={followingAuthorIds}
            followBusyAuthorId={followBusyAuthorId}
            onAuthorFollowToggle={onAuthorFollowToggle}
            showPromoSlots={showPromoSlots}
            hotDestinations={[...hotDestinations]}
          />
          {hasMore && (
            <>
              <div ref={loadSentinelRef} className="h-px w-full shrink-0" aria-hidden />
              <div className="flex justify-center py-4">
                <form
                  className="inline"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    if (!feedLoadingMore) onLoadMore();
                  }}
                >
                  <button
                    type="submit"
                    disabled={feedLoadingMore}
                    aria-busy={feedLoadingMore ? true : undefined}
                    aria-label={feedLoadingMore ? t("common_loading") : t("community_load_more")}
                    className={`${TT_COMMUNITY_FEED_L5.loadMoreBtn} ${communityCardLinkFocus}`}
                  >
                    {feedLoadingMore ? t("common_loading") : t("community_load_more")}
                  </button>
                </form>
              </div>
            </>
          )}
          {!hasMore && postsToShow.length > 0 ? (
            <p className={TT_COMMUNITY_FEED_L5.feedEndHint} role="status">
              {t("community_feed_end_hint")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
