"use client";

import { CommunityUserPageAlertsSection } from "./CommunityUserPageAlertsSection";
import { CommunityUserPostsFeedSection } from "./CommunityUserPostsFeedSection";
import { CommunityUserPostsVisibilityNav } from "./CommunityUserPostsVisibilityNav";
import { CommunityUserProfileHeader } from "./CommunityUserProfileHeader";
import { CommunityMeSessionPinNote } from "@/components/me/communityMeNotes/CommunityMeSessionPinNote";
import type { CommunityUserPageCore } from "./useCommunityUserPageCore";

export function CommunityUserPageMain({ core }: { core: CommunityUserPageCore }) {
  const {
    t,
    id,
    isSelf,
    isLoggedIn,
    profileAuthor,
    displayName,
    loading,
    userPosts,
    userPostsForFeed,
    pinUserPostToTop,
    postsLoadError,
    deleteError,
    visibilityError,
    followingLoadError,
    setFollowingRetryKey,
    conversationsLoadError,
    setConversationsRetryKey,
    setPostsRetryKey,
    postsVisFilter,
    setPostsVisFilter,
    followBusy,
    followingListFetch,
    isFollowing,
    userProfileReturnPath,
    msgHref,
    handleFollowToggle,
    apiCommentsByPostId,
    likedIds,
    collectedIds,
    handlePostLike,
    handlePostCollect,
    onCommentOpen,
    onDetailOpen,
    handleReport,
    confirmDeletePost,
    deleteBusyId,
  } = core;

  return (
    <main
      data-tt-community-user-page="1"
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      aria-label={t("community_user_main_aria")}
    >
      <CommunityUserProfileHeader
        t={t}
        id={id}
        profileAuthor={profileAuthor}
        displayName={displayName}
        loading={loading}
        userPostsLength={userPosts.length}
        isSelf={isSelf}
        isLoggedIn={isLoggedIn}
        followBusy={followBusy}
        followingListFetch={followingListFetch}
        isFollowing={isFollowing}
        userProfileReturnPath={userProfileReturnPath}
        msgHref={msgHref}
        onFollowSubmit={() => {
          void handleFollowToggle();
        }}
      />

      <CommunityUserPageAlertsSection
        t={t}
        deleteError={deleteError}
        visibilityError={visibilityError}
        isLoggedIn={isLoggedIn}
        isSelf={isSelf}
        followingLoadError={followingLoadError}
        onFollowingRetry={() => setFollowingRetryKey()}
        conversationsLoadError={conversationsLoadError}
        onConversationsRetry={() => setConversationsRetryKey()}
        postsLoadError={postsLoadError}
        onPostsRetry={() => setPostsRetryKey((k) => k + 1)}
      />

      {isSelf ? (
        <CommunityUserPostsVisibilityNav
          t={t}
          postsVisFilter={postsVisFilter}
          onSelectVis={setPostsVisFilter}
        />
      ) : null}

      {isSelf ? <CommunityMeSessionPinNote t={t} visible={!loading && userPosts.length >= 2} surface="page" /> : null}

      <CommunityUserPostsFeedSection
        t={t}
        loading={loading}
        userPosts={userPosts}
        userPostsForFeed={userPostsForFeed}
        postsLoadError={postsLoadError}
        apiCommentsByPostId={apiCommentsByPostId}
        likedIds={likedIds}
        collectedIds={collectedIds}
        isSelf={isSelf}
        onPostLike={handlePostLike}
        onPostCollect={handlePostCollect}
        onCommentOpen={onCommentOpen}
        onDetailOpen={onDetailOpen}
        onReport={isSelf ? undefined : handleReport}
        onDeletePost={isSelf ? confirmDeletePost : undefined}
        deletePostBusyId={isSelf ? deleteBusyId : null}
        onPinToTop={isSelf ? pinUserPostToTop : undefined}
      />
    </main>
  );
}
