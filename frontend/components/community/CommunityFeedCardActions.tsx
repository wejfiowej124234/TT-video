"use client";

import type { FormEvent } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import { CommunityPostShareMenu } from "./CommunityPostShareMenu";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import {
  communityShowcaseEngagementButtonAria,
  communityShowcaseEngagementCountClassName,
} from "@/lib/communityShowcaseEngagementUi";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export type CommunityFeedCardActionsProps = {
  post: CommunityPost;
  displayLikes: number;
  displayComments: number;
  displayCollects: number;
  liked: boolean;
  setLiked: (v: boolean) => void;
  collected: boolean;
  setCollected: (v: boolean) => void;
  t: (key: string) => string;
  onCommentClick?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onReport?: (post: CommunityPost) => void;
};

/** Feed 卡片操作栏：点赞、评论、收藏、分享；从 CommunityFeedCard 拆出 */
export default function CommunityFeedCardActions({
  post,
  displayLikes,
  displayComments,
  displayCollects,
  liked,
  setLiked,
  collected,
  setCollected,
  t,
  onCommentClick,
  onReport,
}: CommunityFeedCardActionsProps) {
  const commentTrigger = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    onCommentClick?.(post, sub ?? undefined);
  };
  const countClassName = communityShowcaseEngagementCountClassName(post.id);
  return (
    <div className={`flex items-center gap-4 pt-2 ${TT_COMMUNITY_DRAWER_L5.feedCardActionsRow} px-3 sm:px-4 pb-3 sm:pb-4`}>
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          setLiked(!liked);
        }}
      >
        <button
          type="submit"
          className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 text-meta motion-sub rounded-[var(--radius-md)] px-1.5 py-1 ${communityShellTabFocus} ${liked ? "text-ref-sun/90" : "text-slate-300 hover:text-ref-sun/95"}`}
          aria-label={communityShowcaseEngagementButtonAria(t, "community_like", displayLikes, post.id)}
        >
          <svg className="h-4 w-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className={countClassName}>{displayLikes}</span>
        </button>
      </form>
      <form className="contents" onSubmit={commentTrigger}>
        <button
          type="submit"
          className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 text-meta text-slate-300 hover:text-ref-sun/95 motion-sub rounded-[var(--radius-md)] px-1.5 py-1 ${communityShellTabFocus}`}
          aria-label={communityShowcaseEngagementButtonAria(t, "community_comment", displayComments, post.id)}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className={countClassName}>{displayComments}</span>
        </button>
      </form>
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          setCollected(!collected);
        }}
      >
        <button
          type="submit"
          className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 text-meta motion-sub rounded-[var(--radius-md)] px-1.5 py-1 ${communityShellTabFocus} ${collected ? "text-ref-sun/90" : "text-slate-300 hover:text-ref-sun/90"}`}
          aria-label={communityShowcaseEngagementButtonAria(t, "community_collect", displayCollects, post.id)}
        >
          <svg className="h-4 w-4" fill={collected ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <span className={countClassName}>{displayCollects}</span>
        </button>
      </form>
      <CommunityPostShareMenu post={post} t={t} onReport={onReport} className="ml-auto" />
    </div>
  );
}
