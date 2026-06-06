"use client";

import type { FormEvent, RefObject } from "react";
import type { CommunityPost, CommunityPostUserVisibility } from "@/lib/communityMockData";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export function PostDetailDrawerHeader({
  backButtonRef,
  drawerTitleId,
  post,
  t,
  onClose,
  onDeletePost,
  deletePostBusy,
  onPostVisibilityChange,
  postVisibilityBusy,
  postVisibilitySelectId,
}: {
  backButtonRef: RefObject<HTMLButtonElement | null>;
  drawerTitleId: string;
  post: CommunityPost;
  t: (key: string) => string;
  onClose: () => void;
  onDeletePost?: () => void | Promise<void>;
  deletePostBusy?: boolean;
  onPostVisibilityChange?: (next: CommunityPostUserVisibility) => void | Promise<void>;
  postVisibilityBusy?: boolean;
  postVisibilitySelectId: string;
}) {
  return (
    <div className={TT_COMMUNITY_DRAWER_L5.postDetailHeaderBar}>
      <form
        className="inline shrink-0"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          onClose();
        }}
      >
        <button
          ref={backButtonRef}
          type="submit"
          className={`${TT_COMMUNITY_DRAWER_L5.postDetailGhostBtn} ${communitySlatePillFocus}`}
          aria-label={t("community_back_drawer")}
        >
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{t("community_back_drawer")}</span>
        </button>
      </form>
      <h2 id={drawerTitleId} className="text-body font-semibold text-ref-sun truncate min-w-0 flex-1 text-center px-2">
        {post.title || t("community_type_" + post.type)}
      </h2>
      {onDeletePost ? (
        <div className="flex shrink-0 items-center gap-2">
          {onPostVisibilityChange ? (
            post.visibilityStatus === "hidden" ? (
              <span
                className="inline-flex max-w-[10rem] min-h-[44px] items-center rounded-[var(--radius-md)] border border-rose-500/40 bg-rose-500/10 px-2 py-2 text-meta text-rose-200/95"
                title={t("community_post_visibility_hidden_hint")}
              >
                {t("community_me_posts_badge_hidden")}
              </span>
            ) : (
              <>
                <label htmlFor={postVisibilitySelectId} className="sr-only">
                  {t("community_post_visibility_label")}
                </label>
                <select
                  id={postVisibilitySelectId}
                  disabled={postVisibilityBusy}
                  aria-busy={postVisibilityBusy ? true : undefined}
                  value={post.visibilityStatus ?? "public"}
                  onChange={(e) => void onPostVisibilityChange(e.target.value as CommunityPostUserVisibility)}
                  className={`${TT_COMMUNITY_DRAWER_L5.postDetailSelect} ${communitySlatePillFocus}`}
                >
                  <option value="public">{t("community_post_visibility_public")}</option>
                  <option value="private">{t("community_post_visibility_private")}</option>
                  <option value="archived">{t("community_post_visibility_archived")}</option>
                </select>
              </>
            )
          ) : null}
          <form
            className="inline shrink-0"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              void onDeletePost();
            }}
          >
            <button
              type="submit"
              disabled={deletePostBusy}
              aria-busy={deletePostBusy ? true : undefined}
              className="shrink-0 rounded-[var(--radius-md)] border border-danger/50 bg-danger/20 px-2.5 py-2 text-meta text-danger/95 hover:bg-danger/30 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t("community_delete_post")}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <div className="w-11 sm:w-20 shrink-0" aria-hidden />
      )}
    </div>
  );
}
