"use client";

import { useState } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import CommunityFeedCardMedia from "./CommunityFeedCardMedia";
import CommunityFeedCardContent from "./CommunityFeedCardContent";
import CommunityFeedCardActions from "./CommunityFeedCardActions";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";

/** 首页 Feed：传入时关注对接 `POST/DELETE .../community/users/:id/follow`（04 §3.4） */
export type CommunityFeedCardAuthorFollow = {
  followed: boolean;
  onToggle: () => void;
  disabled?: boolean;
  hidden?: boolean;
};

/** 31 TT社区 · 单条 Feed 卡片：多图轮播/单图/视频 + 文案 + 作者 + 关注/点赞/收藏/分享；51-31-8 支持受控点赞/收藏 */
export function CommunityFeedCard({
  post,
  commentCount,
  t,
  liked: controlledLiked,
  onLike,
  collected: controlledCollected,
  onCollect,
  onCommentClick,
  onViewFull,
  onPlayVideo,
  onReport,
  onTagClick,
  authorFollow,
  showVisibilityStatusBadge,
}: {
  post: CommunityPost;
  commentCount?: number;
  t: (key: string) => string;
  liked?: boolean;
  onLike?: () => void;
  collected?: boolean;
  onCollect?: () => void;
  onCommentClick?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onViewFull?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onPlayVideo?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onReport?: (post: CommunityPost) => void;
  onTagClick?: (tag: string) => void;
  authorFollow?: CommunityFeedCardAuthorFollow;
  showVisibilityStatusBadge?: boolean;
}) {
  const { type, media_url, media_urls, is_video, destination } = post;
  const tags = post.tags ?? [];
  const { author, likes, comments, collects } = post;
  const displayComments = commentCount ?? comments;
  const roleKey = communityStoredRoleLabelI18nKey(author?.role);
  const images = media_urls && media_urls.length > 0 ? media_urls : (media_url ? [media_url] : []);
  const [localLiked, setLocalLiked] = useState(false);
  const [localCollected, setLocalCollected] = useState(false);
  const [localFollowed, setLocalFollowed] = useState(false);
  const liked = onLike !== undefined ? (controlledLiked ?? false) : localLiked;
  const setLiked = onLike !== undefined ? (_: boolean | ((v: boolean) => boolean)) => { onLike(); } : setLocalLiked;
  const collected = onCollect !== undefined ? (controlledCollected ?? false) : localCollected;
  const setCollected = onCollect !== undefined ? (_: boolean | ((v: boolean) => boolean)) => { onCollect(); } : setLocalCollected;
  const displayLikes = liked ? likes + 1 : likes;
  const displayCollects = collected ? collects + 1 : collects;
  const followed = authorFollow ? authorFollow.followed : localFollowed;

  return (
    <article
      className="rounded-[var(--radius-md)] border border-cyan-500/30 border-fuchsia-500/20 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-scifi-panel motion-sub hover:border-cyan-500/50 hover:shadow-scifi-hover-soft"
      aria-labelledby={post.id}
    >
      <CommunityFeedCardMedia
        post={post}
        images={images}
        is_video={!!is_video}
        type={type}
        t={t}
        onDoubleTapLike={() => {
          if (onLike) {
            if (!liked) onLike();
          } else {
            setLocalLiked(true);
          }
        }}
        onPlayVideo={onPlayVideo}
      />
      <CommunityFeedCardContent
        post={post}
        destination={destination}
        tags={tags}
        roleKey={roleKey}
        t={t}
        followed={followed}
        setFollowed={authorFollow ? undefined : setLocalFollowed}
        onFollowPress={authorFollow?.onToggle}
        followDisabled={authorFollow?.disabled}
        followHidden={authorFollow?.hidden}
        onViewFull={onViewFull}
        onTagClick={onTagClick}
        showVisibilityStatusBadge={showVisibilityStatusBadge}
      />
      <CommunityFeedCardActions
        post={post}
        displayLikes={displayLikes}
        displayComments={displayComments}
        displayCollects={displayCollects}
        liked={liked}
        setLiked={setLiked}
        collected={collected}
        setCollected={setCollected}
        t={t}
        onCommentClick={onCommentClick}
        onReport={onReport}
      />
    </article>
  );
}
