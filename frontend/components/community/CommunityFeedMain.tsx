"use client";

import { useMemo, useCallback, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPublicPostsByTagCount } from "@/lib/apiClient/community";
import { CommunityFeedDiscoveryChrome } from "@/components/community/CommunityFeedDiscoveryChrome";
import CommunityFeedDesktopLead from "@/components/community/CommunityFeedDesktopLead";
import CommunityFeedHeader from "@/components/community/CommunityFeedHeader";
import { CommunityFeedMediaCapabilitiesBanner } from "@/components/community/CommunityFeedMediaCapabilitiesBanner";
import { CommunityFeedShowcaseNotice } from "@/components/community/CommunityFeedShowcaseNotice";
import {
  ColdStartCampaignSurfaceSection,
  COLD_START_SURFACE_COMMUNITY_FEED,
} from "@/components/coldStartCampaign/ColdStartCampaignSurfaceSection";
import { useCommunityFeed } from "@/components/community/useCommunityFeed";
import { suggestedAuthorsFromPosts } from "@/components/community/communitySuggestedAuthors";
import CommunityFeedList from "@/components/community/CommunityFeedList";
import { detailVideoFeedPostIdsFromPosts } from "@/components/community/postDetailVideoFeedNav";
import CommunityTopicHero from "@/components/community/CommunityTopicHero";
import CommunityFeedMainPortals from "@/components/community/CommunityFeedMainPortals";
import {
  communityCardLinkFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import {
  TT_COMMUNITY_DRAWER_L5,
  TT_COMMUNITY_FEED_ACTION,
  TT_COMMUNITY_FEED_ASIDE_GRID_CELL,
  TT_COMMUNITY_FEED_DESKTOP_GRID,
  TT_COMMUNITY_FEED_MAIN_GRID_CELL,
  TT_COMMUNITY_FEED_STACK,
  TT_MARKETING_COMMUNITY_FEED_PAGE,
} from "@/lib/marketingUi";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const CommunityFeedDesktopAside = dynamic(() => import("@/components/community/CommunityFeedDesktopAside"), {
  ssr: false,
  loading: () => null,
});

const CommunityLoginModal = dynamic(() => import("@/components/community/CommunityLoginModal"), {
  ssr: false,
  loading: () => null,
});

/** 31 附录：Feed 主区（与 `/community`、`/community/topic/[tag]` 共用） */
export default function CommunityFeedMain({
  initialSnapshot = null,
}: {
  initialSnapshot?: import("@/lib/community/communityFeedInitialData").CommunityFeedInitialSnapshot | null;
}) {
  const {
    t,
    isLoggedIn,
    authLoading,
    feedSearchMode,
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
    anchorPoiId,
    setAnchorPoiId,
    proximityFilter,
    setProximityFilter,
    feedError,
    refreshFeed,
    clearFilters,
    applySearchAsTopicTag,
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
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    commentPost,
    commentsForPost,
    detailPost,
    commentsForDetail,
    detailFocusComments,
    openPostDetail,
    detailPostAuthorFollow,
    showLoginModal,
    setShowLoginModal,
    publishOpen,
    toast,
    toastBodyOverride,
    toastHint,
    apiCommentsByPostId,
    loginBackButtonRef,
    closeCommentDrawer,
    closeDetailDrawer,
    closePublishDrawer,
    postDeepLinkBusy,
    postDeepLinkAlert,
    dismissPostDeepLinkIssue,
    retryPostDeepLinkFetch,
  } = useCommunityFeed({ initialSnapshot });

  const desktopSuggestedAuthors = useMemo(
    () =>
      suggestedAuthorsFromPosts(searchFilteredPosts, {
        meUserId,
        followingAuthorIds: followingAuthorIdSet,
        max: 6,
      }),
    [searchFilteredPosts, meUserId, followingAuthorIdSet],
  );

  const detailVideoFeedPostIds = useMemo(
    () => detailVideoFeedPostIdsFromPosts(postsToShow),
    [postsToShow],
  );

  const onDetailVideoFeedSelect = useCallback(
    (postId: string) => {
      const p = postsToShow.find((x) => x.id === postId);
      if (p) setDetailPost(p);
    },
    [postsToShow, setDetailPost],
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
      <main
        className={TT_MARKETING_COMMUNITY_FEED_PAGE}
        aria-label={t("community_tab_feed")}
        data-tt-community-feed-page="1"
      >
        <h1 className={TT_COMMUNITY_FEED_ACTION.headerTitleSrOnly}>{t("community_title")}</h1>
        <div className={TT_COMMUNITY_FEED_DESKTOP_GRID}>
          <CommunityFeedDesktopLead t={t} />
          <div className={TT_COMMUNITY_FEED_ASIDE_GRID_CELL}>
            <CommunityFeedDesktopAside
              t={t}
              hotDestinations={hotDestinations}
              destinationFilter={destinationFilter}
              feedPosts={postsToShow}
              suggestedAuthors={desktopSuggestedAuthors}
              followingAuthorIds={followingAuthorIdSet}
              followBusyAuthorId={followBusyAuthorId}
              onAuthorFollowToggle={handleAuthorFollowToggle}
            />
          </div>
          <div className={`${TT_COMMUNITY_FEED_MAIN_GRID_CELL} ${TT_COMMUNITY_FEED_STACK}`}>
            <CommunityFeedHeader t={t} onRefresh={refreshFeed} />

            {postDeepLinkBusy ? (
              <div
                className={TT_COMMUNITY_DRAWER_L5.feedInlineAlert}
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                {t("community_postDeepLink_resolving")}
              </div>
            ) : null}

            {postDeepLinkAlert?.kind === "unavailable" ? (
              <div
                className={TT_COMMUNITY_DRAWER_L5.feedInlineAlertSoft}
                role="region"
                aria-label={t("community_postDeepLink_notFoundOrHidden")}
              >
                <p className="text-small text-slate-200">{t("community_postDeepLink_notFoundOrHidden")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/community"
                    className={`${touchTargetLink44Classes} ${TT_COMMUNITY_FEED_ACTION.secondaryLink}`}
                  >
                    {t("community_postDeepLink_backFeed")}
                  </Link>
                  <Link
                    href="/community/explore"
                    className={`${touchTargetLink44Classes} ${TT_COMMUNITY_FEED_ACTION.secondaryLink}`}
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
                      className={`${TT_COMMUNITY_FEED_ACTION.asideGhostPill} ${communitySlatePillFocus}`}
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
                      className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
                    >
                      {t("common_retry")}
                    </button>
                  </form>
                  <Link
                    href="/community"
                    className={`${touchTargetLink44Classes} ${TT_COMMUNITY_FEED_ACTION.secondaryLink}`}
                  >
                    {t("community_postDeepLink_backFeed")}
                  </Link>
                  <Link
                    href="/community/explore"
                    className={`${touchTargetLink44Classes} ${TT_COMMUNITY_FEED_ACTION.secondaryLink}`}
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
                      className={`${TT_COMMUNITY_FEED_ACTION.asideGhostPill} ${communitySlatePillFocus}`}
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

            <CommunityFeedDiscoveryChrome
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
              feedPosts={postsToShow}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              feedError={feedError}
              onRefresh={refreshFeed}
              onClearFilters={clearFilters}
              tagTopicMatchCount={tagFilter ? searchFilteredPosts.length : undefined}
              onPublishSubmit={openPublishFromForm}
              anchorPoiId={anchorPoiId}
              setAnchorPoiId={setAnchorPoiId}
              proximityFilter={proximityFilter}
              setProximityFilter={setProximityFilter}
              onSearchApplyServerTag={applySearchAsTopicTag}
              feedSearchMode={feedSearchMode}
            />

            <CommunityFeedMediaCapabilitiesBanner t={t} />
            <CommunityFeedShowcaseNotice posts={postsToShow} t={t} />
            <ColdStartCampaignSurfaceSection
              surface={COLD_START_SURFACE_COMMUNITY_FEED}
              className="mb-3 max-w-none px-0"
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
                    className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
                  >
                    {t("common_retry")}
                  </button>
                </form>
              </div>
            )}

            {pullY > 0 && (
              <div
                className="md:hidden flex items-center justify-center text-meta text-ref-sun/85 transition-opacity"
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
              onViewFull={(p, trigger) => openPostDetail(p, trigger, false)}
              onCommentClick={(p, trigger) => openPostDetail(p, trigger, true)}
              onPlayVideo={(p, trigger) => openPostDetail(p, trigger, false)}
              onReport={handleReport}
              onPublishClick={(trigger) => openPublish(trigger)}
              meUserId={meUserId}
              followingAuthorIds={followingAuthorIdSet}
              followBusyAuthorId={followBusyAuthorId}
              onAuthorFollowToggle={handleAuthorFollowToggle}
              sortBy={sortBy}
              hotDestinations={hotDestinations}
              proximityFilter={proximityFilter}
              setProximityFilter={setProximityFilter}
            />
          </div>
        </div>

        <div className="fixed right-4 bottom-24 z-20 sm:right-8 sm:bottom-24 md:hidden">
          <form className="contents" onSubmit={openPublishFromForm}>
            <button
              type="submit"
              className={`${TT_COMMUNITY_FEED_ACTION.publishFab} ${TT_COMMUNITY_FEED_ACTION.publishFabFocus}`}
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

        <div className="relative z-10 pt-6 pb-8 text-center md:hidden">
          <p className="text-meta text-slate-500">{t("community_more_coming")}</p>
        </div>
      </main>

      <CommunityFeedMainPortals
        t={t}
        toast={toast}
        toastBodyOverride={toastBodyOverride}
        toastHint={toastHint}
        reportSuccessId={reportSuccessId}
        commentPost={commentPost}
        commentsForPost={commentsForPost}
        apiCommentsByPostId={apiCommentsByPostId}
        closeCommentDrawer={closeCommentDrawer}
        handleCommentSend={handleCommentSend}
        isLoggedIn={isLoggedIn}
        authLoading={authLoading}
        meUserId={meUserId}
        handleReportComment={handleReportComment}
        commentSendFailed={commentSendFailed}
        commentSendErrorMessage={commentSendErrorMessage}
        commentFieldMessages={commentFieldMessages}
        clearCommentSendError={clearCommentSendError}
        commentsLoadError={commentsLoadError}
        retryCommentsLoad={retryCommentsLoad}
        commentSort={commentSort}
        setCommentSort={setCommentSort}
        commentsHasMore={commentsHasMore}
        loadMoreComments={loadMoreComments}
        commentsLoadMoreBusy={commentsLoadMoreBusy}
        reportContext={reportContext}
        closeReportDrawer={closeReportDrawer}
        handleReportSubmit={handleReportSubmit}
        reportSendFailed={reportSendFailed}
        reportErrorMessage={reportErrorMessage}
        reportFieldMessages={reportFieldMessages}
        clearReportSendError={clearReportSendError}
        detailPost={detailPost}
        commentsForDetail={commentsForDetail}
        closeDetailDrawer={closeDetailDrawer}
        detailFocusComments={detailFocusComments}
        handleReport={handleReport}
        likedPostIds={likedPostIds}
        collectedPostIds={collectedPostIds}
        handleLike={handleLike}
        handleCollect={handleCollect}
        detailPostAuthorFollow={detailPostAuthorFollow}
        hrefTopicPathForTag={hrefTopicPathForTag}
        publishOpen={publishOpen}
        closePublishDrawer={closePublishDrawer}
        handlePublishSubmit={handlePublishSubmit}
        publishSendFailed={publishSendFailed}
        publishErrorMessage={publishErrorMessage}
        publishFieldMessages={publishFieldMessages}
        clearPublishSendError={clearPublishSendError}
        detailVideoFeedPostIds={detailVideoFeedPostIds}
        onDetailVideoFeedSelect={onDetailVideoFeedSelect}
        onDetailVideoFeedLoadMore={hasMore ? handleLoadMore : undefined}
        detailVideoFeedLoadingMore={feedLoadingMore}
      />

    </>
  );
}
