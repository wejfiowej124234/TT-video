"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "@/components/community/CommunityFeedCard";
import { CommunityPostShareMenu } from "@/components/community/CommunityPostShareMenu";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import {
  communityShowcaseEngagementButtonAria,
  communityShowcaseEngagementCountClassName,
} from "@/lib/communityShowcaseEngagementUi";
import { TT_COMMUNITY_VIDEO_OVERLAY_L5 } from "@/lib/marketingUi";

export type CommunityVideoOverlayActionRailProps = {
  t: (key: string) => string;
  postId: string;
  post?: CommunityPost;
  likes: number;
  comments: number;
  collects: number;
  liked: boolean;
  collected: boolean;
  authorAvatarUrl?: string | null;
  authorName?: string;
  authorId?: string | null;
  authorFollow?: CommunityFeedCardAuthorFollow;
  onLike: () => void;
  onCollect: () => void;
  onOpenComments: () => void;
  onReport?: (post: CommunityPost) => void;
  commentsOpen: boolean;
};

function formatCount(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1).replace(/\.0$/, "")}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/** 小红书式右侧互动栏：头像 · 关注 · 赞 · 评 · 藏 · 分享 */
export function CommunityVideoOverlayActionRail({
  t,
  postId,
  post,
  likes,
  comments,
  collects,
  liked,
  collected,
  authorAvatarUrl,
  authorName,
  authorId,
  authorFollow,
  onLike,
  onCollect,
  onOpenComments,
  onReport,
  commentsOpen,
}: CommunityVideoOverlayActionRailProps) {
  const profileHref = authorId ? `/community/user/${authorId}` : null;
  const countClassName = communityShowcaseEngagementCountClassName(postId);

  return (
    <div
      className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionRail} ${
        commentsOpen ? TT_COMMUNITY_VIDEO_OVERLAY_L5.actionRailHidden : ""
      }`}
    >
      {authorName ? (
        profileHref ? (
          <Link
            href={profileHref}
            className={`relative mb-1 block h-11 w-11 overflow-hidden rounded-full border-2 border-white/80 ${communityShellTabFocus}`}
            aria-label={authorName}
          >
            {authorAvatarUrl ? (
              <Image src={authorAvatarUrl} alt="" fill className="object-cover" sizes="44px" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-ink-800 text-meta text-ref-sun/90">
                {authorName.slice(0, 1)}
              </span>
            )}
          </Link>
        ) : (
          <div className="relative mb-1 h-11 w-11 overflow-hidden rounded-full border-2 border-white/80">
            {authorAvatarUrl ? (
              <Image src={authorAvatarUrl} alt="" fill className="object-cover" sizes="44px" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-ink-800 text-meta text-ref-sun/90">
                {authorName.slice(0, 1)}
              </span>
            )}
          </div>
        )
      ) : null}

      {authorFollow && !authorFollow.hidden ? (
        <form
          className="contents"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            void authorFollow.onToggle();
          }}
        >
          <button
            type="submit"
            disabled={authorFollow.disabled}
            className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtn} mb-1 min-h-[36px] min-w-[36px] px-2 text-[0.62rem] font-semibold ${
              authorFollow.followed ? TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtnActive : ""
            }`}
            aria-label={authorFollow.followed ? t("community_following") : t("community_follow")}
          >
            {authorFollow.followed ? t("community_following") : t("community_follow")}
          </button>
        </form>
      ) : null}

      <form className="contents" onSubmit={(e) => { e.preventDefault(); onLike(); }}>
        <button
          type="submit"
          className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtn} motion-sub active:scale-90 ${liked ? TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtnActive : ""}`}
          aria-label={communityShowcaseEngagementButtonAria(t, "community_like", likes, postId)}
          aria-pressed={liked ? true : undefined}
        >
          <svg className="h-6 w-6" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {likes > 0 ? <span className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionCount} ${countClassName}`}>{formatCount(likes)}</span> : null}
        </button>
      </form>

      <button
        type="button"
        className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtn} ${commentsOpen ? TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtnActive : ""}`}
        aria-label={communityShowcaseEngagementButtonAria(t, "community_comment", comments, postId)}
        aria-expanded={commentsOpen}
        onClick={onOpenComments}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {comments > 0 ? (
          <span className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionCount} ${countClassName}`}>{formatCount(comments)}</span>
        ) : null}
      </button>

      <form className="contents" onSubmit={(e) => { e.preventDefault(); onCollect(); }}>
        <button
          type="submit"
          className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtn} ${collected ? TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtnActive : ""}`}
          aria-label={communityShowcaseEngagementButtonAria(t, "community_collect", collects, postId)}
          aria-pressed={collected ? true : undefined}
        >
          <svg className="h-6 w-6" fill={collected ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          {collects > 0 ? (
            <span className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionCount} ${countClassName}`}>{formatCount(collects)}</span>
          ) : null}
        </button>
      </form>

      {post ? (
        <CommunityPostShareMenu
          post={post}
          t={t}
          placement="up"
          menuClassName="z-50"
          triggerClassName={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.actionBtn} !min-h-[44px] !min-w-[44px]`}
          onReport={onReport ? () => onReport(post) : undefined}
        />
      ) : null}
    </div>
  );
}
