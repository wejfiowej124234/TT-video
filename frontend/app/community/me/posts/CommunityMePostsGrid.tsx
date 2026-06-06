"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { MePostsEmptyPanel } from "./MePostsEmptyPanel";
import { MePostsFilteredEmptyPanel } from "./MePostsFilteredEmptyPanel";
import { CommunityMePostsPostTile } from "./CommunityMePostsPostTile";
import type { CommunityMePostsVisFilterKey } from "@/lib/communityMePostsVisFilters";
import { CommunityMeListLoadMoreButton } from "@/components/me/communityMeNotes/CommunityMeListLoadMoreButton";
import type { CommunityPostUserVisibility } from "@/lib/communityMockData";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type Props = {
  t: (k: string) => string;
  loading: boolean;
  myPosts: CommunityPost[];
  postsVisFilter: CommunityMePostsVisFilterKey;
  postsLoadError: string | null;
  setPostsRetryKey: Dispatch<SetStateAction<number>>;
  onOpenDetail: (post: CommunityPost, trigger?: HTMLElement | null) => void;
  confirmDeletePost: (postId: string) => void;
  pinPostToTop: (postId: string) => void;
  onVisibilityChange?: (postId: string, next: CommunityPostUserVisibility) => void;
  deleteBusyId: string | null;
  visibilityBusyId?: string | null;
  postsHasMore?: boolean;
  postsLoadMoreBusy?: boolean;
  onLoadMore?: () => void;
  onClearVisFilter: () => void;
};

export function CommunityMePostsGrid({
  t,
  loading,
  myPosts,
  postsVisFilter,
  postsLoadError,
  setPostsRetryKey,
  onOpenDetail,
  confirmDeletePost,
  pinPostToTop,
  onVisibilityChange,
  deleteBusyId,
  visibilityBusyId,
  postsHasMore,
  postsLoadMoreBusy,
  onLoadMore,
  onClearVisFilter,
}: Props) {
  const filteredEmpty = !loading && myPosts.length === 0 && !postsLoadError && postsVisFilter !== "all";

  return (
    <div className="space-y-4">
      {loading ? (
        <section className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-900/70 px-6 py-12 text-center">
          <p className="text-body text-slate-300" role="status" aria-label={t("common_loading")}>
            {t("common_loading")}
          </p>
        </section>
      ) : filteredEmpty ? (
        <MePostsFilteredEmptyPanel t={t} postsVisFilter={postsVisFilter} onClearFilter={onClearVisFilter} />
      ) : myPosts.length === 0 && !postsLoadError ? (
        <MePostsEmptyPanel t={t} />
      ) : !loading && myPosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {myPosts.map((post) => (
            <CommunityMePostsPostTile
              key={post.id}
              post={post}
              t={t}
              onOpenDetail={onOpenDetail}
              onConfirmDelete={confirmDeletePost}
              onPinToTop={pinPostToTop}
              onVisibilityChange={onVisibilityChange}
              deleteBusyId={deleteBusyId}
              visibilityBusyId={visibilityBusyId}
            />
          ))}
        </div>
      ) : null}
      {postsHasMore && onLoadMore ? (
        <CommunityMeListLoadMoreButton
          t={t}
          busy={Boolean(postsLoadMoreBusy)}
          onClick={onLoadMore}
          surface="page"
        />
      ) : null}
    </div>
  );
}

/** Retry block above grid when list load fails */
export function CommunityMePostsLoadErrorRetry({
  t,
  postsLoadError,
  setPostsRetryKey,
}: {
  t: (k: string) => string;
  postsLoadError: string | null;
  setPostsRetryKey: Dispatch<SetStateAction<number>>;
}) {
  if (!postsLoadError) return null;
  return (
    <div className="mb-4 space-y-2">
      <ApiErrorAlert message={postsLoadError} />
      <form
        className="inline"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          setPostsRetryKey((k) => k + 1);
        }}
      >
        <button
          type="submit"
          aria-label={t("common_retry")}
          className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
        >
          {t("common_retry")}
        </button>
      </form>
    </div>
  );
}
