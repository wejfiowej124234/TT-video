import { useCallback } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import { CommunityFeedCard } from "@/components/community/CommunityFeedCard";
import { buildAuthorFollowForPost } from "@/components/community/communityFeedFollowUtils";
import { communityFeedListCardCommentCountHonest } from "@/components/community/communityFeedMappers";
import type { CommunityFeedListProps } from "./communityFeedListTypes";

export function useCommunityFeedListRenderDesktopPost({
  t,
  localCommentsByPostId,
  apiCommentsByPostId = {},
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
}: CommunityFeedListProps) {
  return useCallback(
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
          commentCount={communityFeedListCardCommentCountHonest(
            post,
            apiCommentsByPostId,
            localCommentsByPostId[post.id],
          )}
          t={t}
          liked={likedPostIds?.has(post.id)}
          onLike={onLike ? () => onLike(post.id) : undefined}
          collected={collectedPostIds?.has(post.id)}
          onCollect={onCollect ? () => onCollect(post.id) : undefined}
          onCommentClick={(p, trigger) => onCommentClick(p, trigger)}
          onViewFull={(p, trigger) => onViewFull(p, trigger)}
          onPlayVideo={(p, trigger) => (onPlayVideo ?? onViewFull)(p, trigger)}
          onReport={onReport}
          onTagClick={setTagFilter}
          authorFollow={authorFollow}
        />
      );
    },
    [
      t,
      localCommentsByPostId,
      apiCommentsByPostId,
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
}
