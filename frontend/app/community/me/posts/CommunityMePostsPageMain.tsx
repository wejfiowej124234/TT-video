"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  communityCyanPillFocus,
} from "@/lib/communityA11yFocus";
import { COMMUNITY_FEED_LIST_API_MAX } from "@/lib/apiClient/community";
import { CommunityMePostsVisFilterGroup } from "@/components/me/communityMeNotes/CommunityMePostsVisFilterGroup";
import { CommunityMeSessionPinNote } from "@/components/me/communityMeNotes/CommunityMeSessionPinNote";
import { CommunityMePostsGrid, CommunityMePostsLoadErrorRetry } from "./CommunityMePostsGrid";
import type { CommunityMePostsPageViewModel } from "./useCommunityMePostsPage";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export function CommunityMePostsPageMain({ vm }: { vm: CommunityMePostsPageViewModel }) {
  const {
    t,
    deleteError,
    visibilityError,
    postsVisFilter,
    setPostsVisFilter,
    postsLoadError,
    setPostsRetryKey,
    postsListTruncated,
    postsHasMore,
    postsLoadMoreBusy,
    loadMorePosts,
    loading,
    myPosts,
    confirmDeletePost,
    deleteBusyId,
    visibilityBusyId,
    openPostDetail,
    pinPostToTop,
    handleGridVisibilityChange,
  } = vm;

  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      aria-label={t("community_me_my_posts")}
      data-tt-community-me-posts-page="1"
    >
      <header className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-900/60 backdrop-blur-md px-4 py-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-h4 font-bold text-ref-sun/90">{t("community_me_my_posts")}</h1>
          <Link
            href="/me/settings/profile"
            className={`${TT_COMMUNITY_PAGE_L5.pillCompact} ${communityCyanPillFocus}`}
          >
            {t("me_title")}
          </Link>
        </div>
      </header>

      {deleteError && (
        <div className="mb-4">
          <ApiErrorAlert message={deleteError} />
        </div>
      )}
      {visibilityError && (
        <div className="mb-4">
          <ApiErrorAlert message={visibilityError} />
        </div>
      )}

      <CommunityMePostsVisFilterGroup
        t={t}
        postsVisFilter={postsVisFilter}
        onSelect={setPostsVisFilter}
        variant="page"
      />

      {postsListTruncated && !postsHasMore ? (
        <p
          className="mb-4 rounded-[var(--radius-md)] border border-warning/35 bg-warning/20 px-3 py-2 text-meta text-slate-200"
          role="status"
        >
          {t("community_me_posts_page_truncated_hint", {
            maxPosts: String(COMMUNITY_FEED_LIST_API_MAX),
          })}
        </p>
      ) : null}

      <CommunityMePostsLoadErrorRetry
        t={t}
        postsLoadError={postsLoadError}
        setPostsRetryKey={setPostsRetryKey}
      />

      <CommunityMeSessionPinNote t={t} visible={!loading && myPosts.length >= 2} surface="page" />

      <CommunityMePostsGrid
        t={t}
        loading={loading}
        myPosts={myPosts}
        postsVisFilter={postsVisFilter}
        postsLoadError={postsLoadError}
        setPostsRetryKey={setPostsRetryKey}
        onOpenDetail={openPostDetail}
        confirmDeletePost={confirmDeletePost}
        pinPostToTop={pinPostToTop}
        onVisibilityChange={handleGridVisibilityChange}
        deleteBusyId={deleteBusyId}
        visibilityBusyId={visibilityBusyId}
        postsHasMore={postsHasMore}
        postsLoadMoreBusy={postsLoadMoreBusy}
        onLoadMore={loadMorePosts}
        onClearVisFilter={() => setPostsVisFilter("all")}
      />
    </main>
  );
}
