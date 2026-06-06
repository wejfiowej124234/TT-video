"use client";

import type { FormEvent } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import {
  communityShowcaseEngagementButtonAria,
  communityShowcaseEngagementCountClassName,
} from "@/lib/communityShowcaseEngagementUi";
import { CommunityPostShareMenu } from "./CommunityPostShareMenu";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export function PostDetailDrawerActionBar({
  t,
  post,
  showPostInteractions,
  interactionDisabled,
  likedState,
  collectedState,
  displayLikes,
  displayCollects,
  displayCommentCount,
  onLike,
  onCollect,
  onFocusComments,
  onReport,
}: {
  t: (key: string) => string;
  post: CommunityPost;
  showPostInteractions: boolean;
  interactionDisabled: boolean;
  likedState: boolean;
  collectedState: boolean;
  displayLikes: number;
  displayCollects: number;
  displayCommentCount: number;
  onLike?: () => void;
  onCollect?: () => void;
  onFocusComments?: () => void;
  onReport?: (post: CommunityPost) => void;
}) {
  const countClassName = communityShowcaseEngagementCountClassName(post.id);

  return (
    <div className={TT_COMMUNITY_DRAWER_L5.postDetailActionBar} role="toolbar" aria-label={t("community_post_actions_aria")}>
      {showPostInteractions ? (
        <>
          <form
            className="inline"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              void onLike?.();
            }}
          >
            <button
              type="submit"
              disabled={interactionDisabled}
              className={`${TT_COMMUNITY_DRAWER_L5.postDetailActionBtn} ${communityShellTabFocus} ${
                interactionDisabled ? "opacity-50 cursor-not-allowed" : ""
              } ${likedState ? "text-ref-sun/95" : "text-slate-300 hover:text-ref-sun/95"}`}
              aria-label={communityShowcaseEngagementButtonAria(t, "community_like", displayLikes, post.id)}
              aria-pressed={likedState ? true : undefined}
            >
              <svg className="h-5 w-5" fill={likedState ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
          <form
            className="inline"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              void onCollect?.();
            }}
          >
            <button
              type="submit"
              disabled={interactionDisabled}
              className={`${TT_COMMUNITY_DRAWER_L5.postDetailActionBtn} ${communityShellTabFocus} ${
                interactionDisabled ? "opacity-50 cursor-not-allowed" : ""
              } ${collectedState ? "text-ref-sun/95" : "text-slate-300 hover:text-ref-sun/90"}`}
              aria-label={communityShowcaseEngagementButtonAria(t, "community_collect", displayCollects, post.id)}
              aria-pressed={collectedState ? true : undefined}
            >
              <svg className="h-5 w-5" fill={collectedState ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
        </>
      ) : null}
      <button
        type="button"
        className={`${TT_COMMUNITY_DRAWER_L5.postDetailActionBtn} ${communityShellTabFocus} text-slate-300 hover:text-ref-sun/95`}
        aria-label={communityShowcaseEngagementButtonAria(t, "community_comments", displayCommentCount, post.id)}
        onClick={() => onFocusComments?.()}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className={countClassName}>{displayCommentCount}</span>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <CommunityPostShareMenu
          post={post}
          t={t}
          placement="down"
          menuClassName="z-[60]"
          triggerClassName={`${TT_COMMUNITY_DRAWER_L5.postDetailActionBtn} ${communityShellTabFocus} text-slate-300 hover:text-ref-sun/95 !min-h-[44px] !min-w-[44px]`}
          onReport={onReport ? () => onReport(post) : undefined}
        />
      </div>
    </div>
  );
}
