"use client";

import dynamic from "next/dynamic";
import { useMemo, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPublicPostsByTagCount } from "@/lib/apiClient/community";
import { CommentDrawer } from "@/components/community/CommentDrawer";
import CommunityFeedHeader from "@/components/community/CommunityFeedHeader";
import { useCommunityFeed } from "@/components/community/useCommunityFeed";
import CommunityFeedFilterBar from "@/components/community/CommunityFeedFilterBar";
import CommunityFeedDesktopAside from "@/components/community/CommunityFeedDesktopAside";
import { suggestedAuthorsFromPosts } from "@/components/community/communitySuggestedAuthors";
import CommunityFeedList from "@/components/community/CommunityFeedList";
import CommunityLoginModal from "@/components/community/CommunityLoginModal";
import CommunityVideoOverlay from "@/components/community/CommunityVideoOverlay";
import CommunityTopicHero from "@/components/community/CommunityTopicHero";
import { CommunityReportDrawer } from "@/components/community/CommunityReportDrawer";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityPublishFabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const PublishDrawer = dynamic(
  () => import("@/components/community/PublishDrawer").then((m) => ({ default: m.PublishDrawer })),
  { ssr: false }
);
const PostDetailDrawer = dynamic(
  () => import("@/components/community/PostDetailDrawer").then((m) => ({ default: m.PostDetailDrawer })),
  { ssr: false }
);

/** 31 附录：Feed 主区（与 `/community`、`/community/topic/[tag]` 共用） */
export default function CommunityFeedMain() {
  const {
    t,
    isLoggedIn,
    authLoading,
    feedTab,
    setFeedTab,
    sortBy,
    setSortBy,
    typeFilter,
    setTypeFilter,
    regionFilter,
    setRegionFilter,
    destinationFilter,
    setDestinationFilter,
    hotDestinations,
    tagFilter,
    hrefTopicPathForTag,
    setTagFilter,
    searchQuery,
    setSearchQuery,
    feedError,
    refreshFeed,
    clearFilters,
    pullY,
    feedLoading,
    searchFilteredPosts,
    postsToShow,
    localCommentsByPostId,
    hasMore,
    feedLoadingMore,
    handleLoadMore,
    setFeedPage,
    setFeedLoadingMore,
    setFocusReturn,
    setDetailPost,
    setCommentPost,
    setVideoPost,
    openPublish,
    handleReport,
    handleReportComment,
    handleReportSubmit,
    reportContext,
    closeReportDrawer,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    reportSuccessId,
    handleLike,
    handleCollect,
    handleAuthorFollowToggle,
    meUserId,
    followingAuthorIdSet,
    followBusyAuthorId,
    likedPostIds,
    collectedPostIds,
    meCollectsLoadError,
    retryMeCollectsLoad,
    handleCommentSend,
    handlePublishSubmit,
    publishSendFailed,
    publishErrorMessage,
    publishFieldMessages,
    clearPublishSendError,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    commentsLoadError,
    retryCommentsLoad,
    commentSort,
    setCommentSort,
    commentPost,
    commentsForPost,
    detailPost,
    commentsForDetail,
    detailPostAuthorFollow,
    showLoginModal,
    setShowLoginModal,
    publishOpen,
    toast,
    toastBodyOverride,
    toastHint,
    videoPost,
    focusReturnTargetRef,
    videoBackButtonRef,
    loginBackButtonRef,
    closeCommentDrawer,
    closeDetailDrawer,
    closePublishDrawer,
    closeVideoOverlay,
    postDeepLinkBusy,
    postDeepLinkAlert,
    dismissPostDeepLinkIssue,
    retryPostDeepLinkFetch,
  } = useCommunityFeed();

  const desktopSuggestedAuthors = useMemo(
    () =>
      suggestedAuthorsFromPosts(searchFilteredPosts, {
        meUserId,
        followingAuthorIds: followingAuthorIdSet,
        max: 6,
      }),
    [searchFilteredPosts, meUserId, followingAuthorIdSet]
  );

  const clearTopicOnly = () => setTagFilter(null);

  const openPublishFromForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    openPublish(sub);
  };

  const tagStatsQ = useQuery({
    queryKey: ["community", "stats", "posts-by-tag", tagFilter],
    queryFn: async () => {
      const r = await getPublicPostsByTagCount(tagFilter!);
      if (r?.status !== "ok" || typeof r.post_count !== "number") return null;
      return r.post_count;
    },
    enabled: Boolean(tagFilter),
    staleTime: 60_000,
  });

  return (
    <>
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6" aria-label={t("community_tab_feed")}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="min-w-0 flex-1 w-full max-w-4xl mx-auto lg:mx-0">
            <CommunityFeedHeader t={t} onRefresh={refreshFeed} />

            {postDeepLinkBusy ? (
              <div
                className="mb-4 rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-small text-slate-200"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                {t("community_postDeepLink_resolving")}
              </div>
            ) : null}

            {postDeepLinkAlert?.kind === "unavailable" ? (
              <div
                className="mb-4 rounded-[var(--radius-md)] border border-slate-500/50 bg-slate-800/40 px-4 py-3 space-y-3"
                role="region"
                aria-label={t("community_postDeepLink_notFoundOrHidden")}
              >
                <p className="text-small text-slate-200">{t("community_postDeepLink_notFoundOrHidden")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/community"
                    className={`${touchTargetLink44Classes} text-meta font-medium text-cyan-300 hover:text-cyan-100`}
                  >
                    {t("community_postDeepLink_backFeed")}
                  </Link>
                  <Link
                    href="/community/explore"
                    className={`${touchTargetLink44Classes} text-meta font-medium text-cyan-300 hover:text-cyan-100`}
                  >
                    {t("community_postDeepLink_goExplore")}
                  </Link>
                  <form
                    className="inline"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      dismissPostDeepLinkIssue();
                    }}
                  >
                    <button
                      type="submit"
                      className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-500/60 bg-slate-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-700/60 ${communitySlatePillFocus}`}
                    >
                      {t("common_closeAlert")}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            {postDeepLinkAlert?.kind === "load_failed" ? (
              <div className="mb-4 space-y-2" role="alert" aria-live="polite">
                <ApiErrorAlert message={postDeepLinkAlert.message} tone="dark" />
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    className="inline"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      retryPostDeepLinkFetch();
                    }}
                  >
                    <button
                      type="submit"
                      aria-label={t("common_retry")}
                      className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 ${communityCyanPillFocus}`}
                    >
                      {t("common_retry")}
                    </button>
                  </form>
                  <Link
                    href="/community"
                    className={`${touchTargetLink44Classes} text-meta font-medium text-cyan-300 hover:text-cyan-100`}
                  >
                    {t("community_postDeepLink_backFeed")}
                  </Link>
                  <Link
                    href="/community/explore"
                    className={`${touchTargetLink44Classes} text-meta font-medium text-cyan-300 hover:text-cyan-100`}
                  >
                    {t("community_postDeepLink_goExplore")}
                  </Link>
                  <form
                    className="inline"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      dismissPostDeepLinkIssue();
                    }}
                  >
                    <button
                      type="submit"
                      className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-500/60 bg-slate-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-700/60 ${communitySlatePillFocus}`}
                    >
                      {t("common_closeAlert")}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            {tagFilter ? (
              <CommunityTopicHero
                t={t}
                tag={tagFilter}
                matchCount={searchFilteredPosts.length}
                onClearTag={clearTopicOnly}
                serverPublicCount={tagStatsQ.data ?? undefined}
                serverPublicCountLoading={
                  (tagStatsQ.isLoading || tagStatsQ.isFetching) && !tagStatsQ.isError
                }
                serverPublicCountError={tagStatsQ.isError}
                onRetryServerPublicCount={() => void tagStatsQ.refetch()}
              />
            ) : null}

            <form className="mb-4 block w-full" onSubmit={openPublishFromForm}>
              <button
                type="submit"
                className="w-full rounded-[var(--radius-xl)] border border-cyan-400/40 bg-slate-900/70 backdrop-blur-md px-4 py-3 flex items-center gap-3 text-left motion-sub hover:border-cyan-400/60 hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-h-[52px]"
                aria-label={t("community_publish")}
                title={t("community_publish_entry_hint")}
              >
                <span
                  className="flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300"
                  aria-hidden
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </span>
                <span className="flex-1 text-body text-slate-300 truncate text-left">{t("community_publish_entry_placeholder")}</span>
                <span className="flex-shrink-0 text-meta text-cyan-300">+ {t("community_publish")}</span>
              </button>
            </form>

            <CommunityFeedFilterBar
              t={t}
              feedTab={feedTab}
              setFeedTab={setFeedTab}
              sortBy={sortBy}
              setSortBy={setSortBy}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              regionFilter={regionFilter}
              setRegionFilter={setRegionFilter}
              destinationFilter={destinationFilter}
              setDestinationFilter={setDestinationFilter}
              hotDestinations={hotDestinations}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              feedError={feedError}
              onRefresh={refreshFeed}
              onClearFilters={clearFilters}
              tagTopicMatchCount={tagFilter ? searchFilteredPosts.length : undefined}
            />

            {meCollectsLoadError != null && (
              <div className="mb-4 space-y-2" role="alert" aria-live="polite">
                <ApiErrorAlert message={meCollectsLoadError} tone="dark" />
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    retryMeCollectsLoad();
                  }}
                >
                  <button
                    type="submit"
                    aria-label={t("common_retry")}
                    className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
                  >
                    {t("common_retry")}
                  </button>
                </form>
              </div>
            )}

            {pullY > 0 && (
              <div
                className="md:hidden flex items-center justify-center text-meta text-cyan-300 transition-opacity"
                style={{ height: Math.min(pullY, 56) }}
                role="status"
                aria-live="polite"
                aria-label={pullY > 50 ? t("community_release_to_refresh") : t("community_pull_to_refresh")}
              >
                {pullY > 50 ? t("community_release_to_refresh") : t("community_pull_to_refresh")}
              </div>
            )}

            <CommunityFeedList
              t={t}
              feedLoading={feedLoading}
              isEmpty={searchFilteredPosts.length === 0}
              isEmptySearch={searchQuery.trim().length > 0}
              feedTab={feedTab}
              isLoggedIn={isLoggedIn}
              postsToShow={postsToShow}
              localCommentsByPostId={localCommentsByPostId}
              hasMore={hasMore}
              feedLoadingMore={feedLoadingMore}
              tagFilter={tagFilter}
              tagTopicMatchCount={tagFilter ? searchFilteredPosts.length : undefined}
              topicTagHref={hrefTopicPathForTag}
              setTagFilter={setTagFilter}
              setFeedTab={setFeedTab}
              setSearchQuery={setSearchQuery}
              likedPostIds={likedPostIds}
              collectedPostIds={collectedPostIds}
              onLike={handleLike}
              onCollect={handleCollect}
              onLoadMore={handleLoadMore}
              onViewFull={(p, trigger) => {
                setFocusReturn(trigger ?? null);
                setDetailPost(p);
              }}
              onCommentClick={(p, trigger) => {
                setFocusReturn(trigger ?? null);
                setCommentPost(p);
              }}
              onPlayVideo={(p, trigger) => {
                setFocusReturn(trigger ?? null);
                setVideoPost(p);
              }}
              onReport={handleReport}
              onPublishClick={(trigger) => openPublish(trigger)}
              meUserId={meUserId}
              followingAuthorIds={followingAuthorIdSet}
              followBusyAuthorId={followBusyAuthorId}
              onAuthorFollowToggle={handleAuthorFollowToggle}
            />
          </div>
          <CommunityFeedDesktopAside
            t={t}
            hotDestinations={hotDestinations}
            destinationFilter={destinationFilter}
            setDestinationFilter={setDestinationFilter}
            suggestedAuthors={desktopSuggestedAuthors}
            followingAuthorIds={followingAuthorIdSet}
            followBusyAuthorId={followBusyAuthorId}
            onAuthorFollowToggle={handleAuthorFollowToggle}
          />
        </div>

        <footer className="hidden md:flex fixed bottom-0 left-0 right-0 z-10 pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-end w-full">
            <Link
              href="/"
              className={`pointer-events-auto inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-600 bg-slate-800/90 backdrop-blur px-4 py-2 text-meta text-slate-300 hover:bg-slate-700/90 motion-sub ${communitySlatePillFocus}`}
            >
              {t("community_back")}
            </Link>
          </div>
        </footer>

        <div className="fixed right-4 bottom-24 z-20 sm:right-8 sm:bottom-24 md:bottom-20">
          <form className="contents" onSubmit={openPublishFromForm}>
            <button
              type="submit"
              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-fuchsia-400/60 bg-fuchsia-500/30 px-5 py-2 text-meta font-semibold text-fuchsia-200 shadow-scifi-fuchsia-prominent motion-sub hover:border-fuchsia-400 hover:bg-fuchsia-500/40 hover:text-fuchsia-100 hover:shadow-scifi-fuchsia-prominent-hover ${communityPublishFabFocus}`}
              aria-label={t("community_publish")}
            >
              + {t("community_publish")}
            </button>
          </form>
        </div>

        <CommunityLoginModal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          t={t}
          backButtonRef={loginBackButtonRef}
        />

        <div className="relative z-10 pt-6 pb-8 text-center">
          <p className="text-meta text-slate-400">{t("community_more_coming")}</p>
        </div>
      </main>

      {toast && (
        <div
          className="fixed left-1/2 z-50 w-[min(100vw-1.5rem,22rem)] -translate-x-1/2 rounded-[var(--radius-md)] border border-cyan-500/40 bg-slate-900/95 backdrop-blur px-4 py-3 text-small text-cyan-200 shadow-scifi-toast motion-sub animate-in fade-in duration-200 safe-area-toast-bottom"
          role="status"
          aria-live="polite"
        >
          <p className="text-center font-medium">{toastBodyOverride ?? t(toast)}</p>
          {toast === "community_publish_success" && toastHint ? (
            <div className="mt-2 flex flex-col items-center gap-2 border-t border-cyan-500/20 pt-2">
              <p className="text-meta text-center text-slate-300">{t(toastHint)}</p>
              <Link
                href="/community/me/posts"
                className={`${touchTargetLink44Classes} text-meta font-medium text-cyan-300 underline underline-offset-2 hover:text-cyan-100 motion-sub ${communityCardLinkFocus}`}
              >
                {t("community_publish_view_my_posts")}
              </Link>
            </div>
          ) : null}
          {toast === "community_report_submitted" && reportSuccessId ? (
            <div className="mt-2 flex flex-col items-center gap-2 border-t border-cyan-500/20 pt-2">
              <Link
                href={`/community/me/reports/${encodeURIComponent(reportSuccessId)}`}
                className={`${touchTargetLink44Classes} text-meta font-medium text-cyan-300 underline underline-offset-2 hover:text-cyan-100 motion-sub ${communityCardLinkFocus}`}
              >
                {t("community_report_view_ticket")}
              </Link>
              <Link
                href="/community/me/reports"
                className={`${touchTargetLink44Classes} text-meta font-medium text-slate-300 underline underline-offset-2 hover:text-cyan-100 motion-sub ${communityCardLinkFocus}`}
              >
                {t("community_report_view_all_reports")}
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {commentPost && (
        <CommentDrawer
          post={commentPost}
          comments={commentsForPost}
          commentCount={commentsForPost.length}
          onClose={closeCommentDrawer}
          onSend={(content) => handleCommentSend(commentPost.id, content)}
          t={t}
          isLoggedIn={isLoggedIn}
          authPending={authLoading}
          meUserId={meUserId}
          onReportComment={(c) => handleReportComment(commentPost, c)}
          commentSendError={commentSendFailed}
          commentSendErrorMessage={commentSendErrorMessage}
          commentFieldMessages={commentFieldMessages}
          onRetryComment={clearCommentSendError}
          commentsLoadError={commentsLoadError}
          onRetryCommentsLoad={retryCommentsLoad}
          commentSort={commentSort}
          onCommentSortChange={setCommentSort}
        />
      )}

      {reportContext && (
        <CommunityReportDrawer
          context={reportContext}
          onClose={closeReportDrawer}
          onSubmit={handleReportSubmit}
          t={t}
          reportSendFailed={reportSendFailed}
          reportErrorMessage={reportErrorMessage}
          reportFieldMessages={reportFieldMessages}
          onClearReportError={clearReportSendError}
        />
      )}

      {detailPost && (
        <PostDetailDrawer
          post={detailPost}
          comments={commentsForDetail}
          commentCount={commentsForDetail.length}
          onClose={closeDetailDrawer}
          onCommentSend={(content) => handleCommentSend(detailPost.id, content)}
          t={t}
          isLoggedIn={isLoggedIn}
          authPending={authLoading}
          meUserId={meUserId}
          onReportComment={(c) => handleReportComment(detailPost, c)}
          onReport={handleReport}
          liked={likedPostIds.has(detailPost.id)}
          collected={collectedPostIds.has(detailPost.id)}
          onLike={() => void handleLike(detailPost.id)}
          onCollect={() => void handleCollect(detailPost.id)}
          commentSendError={commentSendFailed}
          commentSendErrorMessage={commentSendErrorMessage}
          commentFieldMessages={commentFieldMessages}
          onRetryComment={clearCommentSendError}
          commentsLoadError={commentsLoadError}
          onRetryCommentsLoad={retryCommentsLoad}
          commentSort={commentSort}
          onCommentSortChange={setCommentSort}
          authorFollow={detailPostAuthorFollow}
          onAfterTopicTagClick={closeDetailDrawer}
          topicTagHref={hrefTopicPathForTag}
        />
      )}

      {publishOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <PublishDrawer
            onClose={closePublishDrawer}
            onSubmit={handlePublishSubmit}
            t={t}
            publishError={publishSendFailed}
            publishErrorMessage={publishErrorMessage}
            publishFieldMessages={publishFieldMessages}
            onRetryPublish={clearPublishSendError}
          />,
          document.body
        )}

      <CommunityVideoOverlay
        open={!!videoPost}
        onClose={closeVideoOverlay}
        t={t}
        backButtonRef={videoBackButtonRef}
        videoUrl={videoPost?.is_video ? (videoPost.media_urls?.[0] ?? videoPost.media_url) : undefined}
        posterUrl={videoPost?.cover_url}
      />
    </>
  );
}
