"use client";

import CommunityFeedHeader from "@/components/community/CommunityFeedHeader";
import { CommunityFeedDiscoveryChrome } from "@/components/community/CommunityFeedDiscoveryChrome";
import CommunityTopicHero from "@/components/community/CommunityTopicHero";
import CommunityFeedList from "@/components/community/CommunityFeedList";
import CommunityFeedMainPreHeroAlerts from "@/components/community/CommunityFeedMainPreHeroAlerts";
import CommunityFeedMainPostFilterAlerts from "@/components/community/CommunityFeedMainPostFilterAlerts";
import type { CommunityFeedMainFeedColumnProps } from "@/components/community/communityFeedMainFeedColumnTypes";
import { TT_COMMUNITY_FEED_LAYOUT } from "@/lib/marketingUi";

export function CommunityFeedMainFeedColumn(props: CommunityFeedMainFeedColumnProps) {
  const {
    t,
    refreshFeed,
    authLoading,
    isLoggedIn,
    communityLoginReturnUrl,
    postDeepLinkBusy,
    postDeepLinkAlert,
    dismissPostDeepLinkIssue,
    retryPostDeepLinkFetch,
    tagFilter,
    searchFilteredPosts,
    clearTopicOnly,
    tagStatsQ,
    openPublishFromForm,
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
    setTagFilter,
    searchQuery,
    setSearchQuery,
    feedError,
    clearFilters,
    applySearchAsTopicTag,
    anchorPoiId,
    setAnchorPoiId,
    proximityFilter,
    setProximityFilter,
    meCollectsLoadError,
    retryMeCollectsLoad,
    pullY,
    feedLoading,
    postsToShow,
    localCommentsByPostId,
    apiCommentsByPostId,
    hasMore,
    feedLoadingMore,
    hrefTopicPathForTag,
    likedPostIds,
    collectedPostIds,
    handleLike,
    handleCollect,
    handleLoadMore,
    openPostDetail,
    handleReport,
    openPublish,
    meUserId,
    followingAuthorIdSet,
    followBusyAuthorId,
    handleAuthorFollowToggle,
    setShowLoginModal,
  } = props;

  return (
    <div className={TT_COMMUNITY_FEED_LAYOUT.feedColumn}>
      <CommunityFeedHeader t={t} onRefresh={refreshFeed} />

      <CommunityFeedMainPreHeroAlerts
        t={t}
        authLoading={authLoading}
        isLoggedIn={isLoggedIn}
        communityLoginReturnUrl={communityLoginReturnUrl}
        postDeepLinkBusy={postDeepLinkBusy}
        postDeepLinkAlert={postDeepLinkAlert}
        dismissPostDeepLinkIssue={dismissPostDeepLinkIssue}
        retryPostDeepLinkFetch={retryPostDeepLinkFetch}
        tagFilter={tagFilter}
      />

      {tagFilter ? (
        <CommunityTopicHero
          t={t}
          tag={tagFilter}
          matchCount={searchFilteredPosts.length}
          onClearTag={clearTopicOnly}
          serverPublicCount={tagStatsQ.data ?? undefined}
          serverPublicCountLoading={(tagStatsQ.isLoading || tagStatsQ.isFetching) && !tagStatsQ.isError}
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
        hotDestinations={[...hotDestinations]}
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
        feedSearchMode={props.feedSearchMode}
      />

      <CommunityFeedMainPostFilterAlerts
        t={t}
        meCollectsLoadError={meCollectsLoadError}
        retryMeCollectsLoad={retryMeCollectsLoad}
        pullY={pullY}
      />

      <CommunityFeedList
        t={t}
        feedLoading={feedLoading}
        isEmpty={searchFilteredPosts.length === 0}
        isEmptySearch={searchQuery.trim().length > 0}
        feedTab={feedTab}
        isLoggedIn={isLoggedIn}
        postsToShow={postsToShow}
        localCommentsByPostId={localCommentsByPostId}
        apiCommentsByPostId={apiCommentsByPostId}
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
        onFollowingEmptyGuestLogin={() => setShowLoginModal(true)}
        sortBy={sortBy}
        hotDestinations={[...hotDestinations]}
        proximityFilter={proximityFilter}
        setProximityFilter={setProximityFilter}
      />
    </div>
  );
}
