"use client";

import type { FormEvent } from "react";
import type { CommunityPost, CommunityPostUserVisibility } from "@/lib/communityMockData";
import { CommunityMePostGridThumb } from "@/components/community/CommunityMePostGridThumb";
import { CommunityMeNotesCardOverflowMenu } from "@/components/me/communityMeNotes/CommunityMeNotesCardOverflowMenu";

type Props = {
  post: CommunityPost;
  t: (k: string) => string;
  onOpenDetail: (post: CommunityPost, trigger?: HTMLElement | null) => void;
  onConfirmDelete: (postId: string) => void;
  onPinToTop: (postId: string) => void;
  onVisibilityChange?: (postId: string, next: CommunityPostUserVisibility) => void;
  deleteBusyId: string | null;
  visibilityBusyId?: string | null;
};

export function CommunityMePostsPostTile({
  post,
  t,
  onOpenDetail,
  onConfirmDelete,
  onPinToTop,
  onVisibilityChange,
  deleteBusyId,
  visibilityBusyId,
}: Props) {
  return (
    <div className="aspect-square relative rounded-[var(--radius-md)] overflow-hidden border border-ref-sun/25 group">
      <form
        className="absolute inset-0"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onOpenDetail(post, e.currentTarget.querySelector("button"));
        }}
      >
        <button
          type="submit"
          className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-inset"
          aria-label={t("community_view_full")}
        >
          <CommunityMePostGridThumb post={post} t={t} />
        </button>
      </form>
      <CommunityMeNotesCardOverflowMenu
        itemId={post.id}
        t={t}
        onDelete={onConfirmDelete}
        onPinToTop={onPinToTop}
        deleteBusyId={deleteBusyId}
        showVisibilityOptions={Boolean(onVisibilityChange)}
        currentVisibility={(post.visibilityStatus ?? "public") as "public" | "private" | "archived"}
        onVisibilityChange={onVisibilityChange}
        visibilityBusyId={visibilityBusyId}
      />
      {post.is_video && (
        <span
          className="absolute right-1 bottom-1 rounded-[var(--radius-sm)] bg-black/60 p-0.5 pointer-events-none"
          aria-hidden
        >
          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      )}
      {(post.visibilityStatus ?? "public") === "private" ? (
        <span className="absolute left-1 bottom-1 rounded-[var(--radius-sm)] bg-ink-950/85 px-1.5 py-0.5 text-micro font-medium text-warning/95 pointer-events-none">
          {t("community_me_posts_badge_private")}
        </span>
      ) : (post.visibilityStatus ?? "public") === "archived" ? (
        <span className="absolute left-1 bottom-1 rounded-[var(--radius-sm)] bg-ink-950/85 px-1.5 py-0.5 text-micro font-medium text-slate-300 pointer-events-none">
          {t("community_me_posts_badge_archived")}
        </span>
      ) : null}
    </div>
  );
}
