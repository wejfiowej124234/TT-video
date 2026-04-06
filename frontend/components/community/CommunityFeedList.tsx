"use client";

import { useCallback, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import type { CommunityPost, CommunityComment } from "@/lib/communityMockData";
import { CommunityFeedCard } from "@/components/community/CommunityFeedCard";
import { CommunityFeedCardCompact } from "@/components/community/CommunityFeedCardCompact";
import { CommunityFeedDesktopWindowVirtual } from "@/components/community/CommunityFeedDesktopWindowVirtual";
import { buildAuthorFollowForPost } from "@/components/community/communityFeedFollowUtils";
import { FeedSkeleton, FeedGridSkeleton } from "./FeedSkeleton";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communityShellTabFocus,
} from "@/lib/communityA11yFocus";

/** 超过此条数时桌面单列使用窗口虚拟列表（31 / 51-31-26） */
const FEED_DESKTOP_VIRTUAL_MIN = 14;

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
}

/** 信息流：骨架 / 空态 / 双列紧凑卡 + 单列大卡 / 加载更多 */
export default function CommunityFeedList({
  t,
  feedLoading,
  isEmpty,
  isEmptySearch,
  feedTab,
  isLoggedIn,
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
}: CommunityFeedListProps) {
  const loadSentinelRef = useRef<HTMLDivElement>(null);

  const renderDesktopPost = useCallback(
    (post: CommunityPost) => {
      const authorFollow =
        onAuthorFollowToggle && followingAuthorIds
          ? buildAuthorFollowForPost(post, {
              meUserId,
              followingAuthorIds,
              followBusyAuthorId,
              onAuthorFollowToggle,
            })
          : undefined;
      return (
        <CommunityFeedCard
          post={post}
          commentCount={post.comments + (localCommentsByPostId[post.id]?.length ?? 0)}
          t={t}
          liked={likedPostIds?.has(post.id)}
          onLike={onLike ? () => onLike(post.id) : undefined}
          collected={collectedPostIds?.has(post.id)}
          onCollect={onCollect ? () => onCollect(post.id) : undefined}
          onCommentClick={(p, trigger) => onCommentClick(p, trigger)}
          onViewFull={(p, trigger) => onViewFull(p, trigger)}
          onPlayVideo={post.is_video ? onPlayVideo : undefined}
          onReport={onReport}
          onTagClick={setTagFilter}
          authorFollow={authorFollow}
        />
      );
    },
    [
      t,
      localCommentsByPostId,
      likedPostIds,
      onLike,
      collectedPostIds,
      onCollect,
      onCommentClick,
      onViewFull,
      onPlayVideo,
      onReport,
      setTagFilter,
      meUserId,
      followingAuthorIds,
      followBusyAuthorId,
      onAuthorFollowToggle,
    ]
  );

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
    <div className="space-y-4 pb-24 safe-area-pb">
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
          className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md px-6 py-12 text-center"
          aria-label={isEmptySearch ? t("community_search_placeholder") : feedTab === "following" ? t("community_following_empty") : t("community_empty")}
        >
          <p className="text-body text-slate-300 mb-4">
            {isEmptySearch ? t("community_search_empty") : feedTab === "following" ? t("community_following_empty") : t("community_empty")}
          </p>
          {isEmptySearch ? (
            <div className="flex flex-col items-center gap-4">
              <form
                className="inline"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  setSearchQuery("");
                }}
              >
                <button
                  type="submit"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
                >
                  {t("community_search_clear")}
                </button>
              </form>
              <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400">
                <Link
                  href="/community/explore"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${communityShellTabFocus}`}
                >
                  {t("community_explore_title")}
                </Link>
                <span className="text-slate-500" aria-hidden>
                  ·
                </span>
                <Link
                  href="/help"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${communityShellTabFocus}`}
                >
                  {t("help_title")}
                </Link>
              </p>
            </div>
          ) : feedTab === "following" ? (
            <div className="flex flex-col items-center gap-4">
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
                    className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
                  >
                    {t("community_following_see_recommend")}
                  </button>
                </form>
                <Link
                  href="/community/friends"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-4 py-2 text-meta font-medium text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/30 motion-sub ${communityFuchsiaPillFocus}`}
                >
                  {t("community_following_follow_more")}
                </Link>
              </div>
              <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400">
                <Link
                  href="/community/explore"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${communityShellTabFocus}`}
                >
                  {t("community_explore_title")}
                </Link>
                <span className="text-slate-500" aria-hidden>
                  ·
                </span>
                <Link
                  href="/help"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${communityShellTabFocus}`}
                >
                  {t("help_title")}
                </Link>
                <span className="text-slate-500" aria-hidden>
                  ·
                </span>
                <Link
                  href="/terms/community-guidelines"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${communityShellTabFocus}`}
                >
                  {t("community_guidelines")}
                </Link>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
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
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
                >
                  {t("community_empty_cta")}
                </button>
              </form>
              <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400">
                <Link
                  href="/community/explore"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${communityShellTabFocus}`}
                >
                  {t("community_explore_title")}
                </Link>
                <span className="text-slate-500" aria-hidden>
                  ·
                </span>
                <Link
                  href="/help"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${communityShellTabFocus}`}
                >
                  {t("help_title")}
                </Link>
                <span className="text-slate-500" aria-hidden>
                  ·
                </span>
                <Link
                  href="/terms/community-guidelines"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${communityShellTabFocus}`}
                >
                  {t("community_guidelines")}
                </Link>
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          {tagFilter && (
            <div className="flex flex-wrap items-center gap-2 mb-2 text-meta text-cyan-300">
              <span className="font-medium text-cyan-200">#{tagFilter}</span>
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
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-cyan-400/50 text-body font-medium text-cyan-200 hover:bg-cyan-500/20 ${communityShellTabFocus}`}
                  aria-label={t("community_tag_clear_filter")}
                >
                  ×
                </button>
              </form>
            </div>
          )}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {postsToShow.map((post) => (
              <CommunityFeedCardCompact
                key={post.id}
                post={post}
                commentCount={post.comments + (localCommentsByPostId[post.id]?.length ?? 0)}
                t={t}
                liked={likedPostIds?.has(post.id)}
                onLike={onLike ? () => onLike(post.id) : undefined}
                onViewFull={(p, trigger) => onViewFull(p, trigger)}
                onPlayVideo={post.is_video ? onPlayVideo : undefined}
                onReport={onReport}
                topicTagHref={topicTagHref}
                authorFollow={
                  onAuthorFollowToggle && followingAuthorIds
                    ? buildAuthorFollowForPost(post, {
                        meUserId,
                        followingAuthorIds,
                        followBusyAuthorId,
                        onAuthorFollowToggle,
                      })
                    : undefined
                }
              />
            ))}
          </div>
          <div className="hidden md:block space-y-4">
            {postsToShow.length >= FEED_DESKTOP_VIRTUAL_MIN ? (
              <CommunityFeedDesktopWindowVirtual posts={postsToShow} renderItem={renderDesktopPost} />
            ) : (
              postsToShow.map((post) => <div key={post.id}>{renderDesktopPost(post)}</div>)
            )}
          </div>
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
                    className={`inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-6 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] disabled:opacity-70 disabled:cursor-wait ${communityCyanPillFocus}`}
                  >
                    {feedLoadingMore ? t("common_loading") : t("community_load_more")}
                  </button>
                </form>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
