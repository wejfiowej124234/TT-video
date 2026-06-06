"use client";

import CommunityFeedDesktopAside from "@/components/community/CommunityFeedDesktopAside";
import CommunityFeedMainPageChrome from "@/components/community/CommunityFeedMainPageChrome";
import { CommunityFeedMainFeedColumn } from "./CommunityFeedMainFeedColumn";
import type { CommunityFeedMainShellProps } from "./communityFeedMainFeedColumnTypes";

export function CommunityFeedMainShell(props: CommunityFeedMainShellProps) {
  const { desktopSuggestedAuthors, showLoginModal, loginBackButtonRef, ...rest } = props;

  return (
    <main
      className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6"
      aria-label={rest.t("community_tab_feed")}
      data-tt-community-feed-page="1"
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        <CommunityFeedMainFeedColumn {...rest} />
        <CommunityFeedDesktopAside
          t={rest.t}
          hotDestinations={[...rest.hotDestinations]}
          destinationFilter={rest.destinationFilter}
          feedPosts={rest.postsToShow}
          suggestedAuthors={desktopSuggestedAuthors}
          followingAuthorIds={rest.followingAuthorIdSet}
          followBusyAuthorId={rest.followBusyAuthorId}
          onAuthorFollowToggle={rest.handleAuthorFollowToggle}
        />
      </div>

      <CommunityFeedMainPageChrome
        t={rest.t}
        showLoginModal={showLoginModal}
        setShowLoginModal={rest.setShowLoginModal}
        loginBackButtonRef={loginBackButtonRef}
        onSubmitPublishFab={rest.openPublishFromForm}
      />
    </main>
  );
}
