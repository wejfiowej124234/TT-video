"use client";

import type { CommunityPost } from "@/lib/communityMockData";
import { communityDrawerCommentCountHonest } from "@/components/community/communityFeedMappers";
import { isShowcasePostId } from "@/lib/communityShowcase";
import { buildAuthorFollowForPost } from "@/components/community/communityFeedFollowUtils";
import { CommunityFeedMasonryCard } from "@/components/community/CommunityFeedMasonryCard";
import { CommunityFeedMasonryPromoTail } from "@/components/community/CommunityFeedMasonryPromoTail";
import { CommunityFeedPromoLeadBand } from "@/components/community/CommunityFeedPromoLeadBand";
import {
  CommunityFeedPromoActivitySlot,
  CommunityFeedPromoHotRankSlot,
} from "@/components/community/CommunityFeedPromoSlots";
import { CommunityFeedVideoAutoplayProvider } from "@/components/community/CommunityFeedVideoAutoplayContext";
import { communityFeedMasonryPostsExcludingPromoPreview, pickCommunityFeedPromoPreviewPost } from "@/components/community/communityFeedPromoMedia";
import { COMMUNITY_FEED_LIST_DEFAULT_PAGE } from "@/lib/apiClient/community/constants";
import { TT_COMMUNITY_FEED_LAYOUT, TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";
import type { CommunityFeedListProps } from "./communityFeedListTypes";

export type CommunityFeedMasonryGridProps = Pick<
  CommunityFeedListProps,
  | "t"
  | "postsToShow"
  | "localCommentsByPostId"
  | "apiCommentsByPostId"
  | "likedPostIds"
  | "collectedPostIds"
  | "onLike"
  | "onCollect"
  | "onCommentClick"
  | "onViewFull"
  | "onPlayVideo"
  | "onReport"
  | "topicTagHref"
  | "meUserId"
  | "followingAuthorIds"
  | "followBusyAuthorId"
  | "onAuthorFollowToggle"
> & {
  /** 推荐首屏 · 美团式双卡占瀑布前两格 */
  showPromoSlots?: boolean;
  hotDestinations?: string[];
};

/** 推荐流 · CSS columns 瀑布 + 视口内视频静音 autoplay */
export function CommunityFeedMasonryGrid({
  t,
  postsToShow,
  localCommentsByPostId,
  apiCommentsByPostId = {},
  likedPostIds,
  collectedPostIds,
  onLike,
  onCollect,
  onCommentClick,
  onViewFull,
  onPlayVideo,
  onReport,
  topicTagHref,
  meUserId,
  followingAuthorIds,
  followBusyAuthorId,
  onAuthorFollowToggle,
  showPromoSlots = false,
  hotDestinations = [],
}: CommunityFeedMasonryGridProps) {
  const previewPost =
    showPromoSlots && postsToShow.length > COMMUNITY_FEED_LIST_DEFAULT_PAGE
      ? pickCommunityFeedPromoPreviewPost(postsToShow)
      : undefined;
  const gridPosts = communityFeedMasonryPostsExcludingPromoPreview(postsToShow, {
    showPromoSlots,
    previewPost,
  });

  return (
    <CommunityFeedVideoAutoplayProvider>
      {showPromoSlots ? (
        <CommunityFeedPromoLeadBand
          t={t}
          hotDestinations={hotDestinations}
          feedPosts={postsToShow}
          previewPost={previewPost}
        />
      ) : null}
      <div
        className={`${TT_COMMUNITY_FEED_LAYOUT.masonry} [content-visibility:auto]`}
        role="list"
        aria-label={t("community_feed_masonry_list")}
      >
        {showPromoSlots ? (
          <>
            <div className={TT_COMMUNITY_FEED_L5.promoMasonryInflow}>
              <CommunityFeedPromoActivitySlot t={t} previewPost={previewPost} />
            </div>
            <div className={TT_COMMUNITY_FEED_L5.promoMasonryInflow}>
              <CommunityFeedPromoHotRankSlot
                t={t}
                hotDestinations={hotDestinations}
                feedPosts={postsToShow}
              />
            </div>
          </>
        ) : null}
        {gridPosts.map((post, index) => {
          const localComments = localCommentsByPostId[post.id] ?? [];
          const apiComments = apiCommentsByPostId[post.id] ?? [];
          const commentCount = communityDrawerCommentCountHonest(post, [...apiComments, ...localComments], {
            apiFetched: isShowcasePostId(post.id) || post.id in apiCommentsByPostId,
          });
          return (
          <CommunityFeedMasonryCard
            key={post.id}
            post={post}
            t={t}
            liked={likedPostIds?.has(post.id)}
            collected={collectedPostIds?.has(post.id)}
            commentCount={commentCount}
            onLike={onLike ? () => onLike(post.id) : undefined}
            onCollect={onCollect ? () => onCollect(post.id) : undefined}
            onCommentClick={
              onCommentClick ? (p, trigger) => onCommentClick(p, trigger) : undefined
            }
            onViewFull={(p, trigger) => onViewFull(p, trigger)}
            onPlayVideo={(p, trigger) => (onPlayVideo ?? onViewFull)(p, trigger)}
            onReport={onReport}
            topicTagHref={topicTagHref}
            testId={index === 0 ? "community-feed-first-post" : undefined}
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
          );
        })}
      </div>
      {showPromoSlots && gridPosts.length === 0 ? <CommunityFeedMasonryPromoTail t={t} /> : null}
    </CommunityFeedVideoAutoplayProvider>
  );
}
