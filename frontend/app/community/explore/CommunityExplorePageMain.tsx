"use client";

import { CommunityExplorePageAuthorsSection } from "./CommunityExplorePageAuthorsSection";
import { CommunityExplorePageDestinationsSection } from "./CommunityExplorePageDestinationsSection";
import { CommunityExplorePageHeader } from "./CommunityExplorePageHeader";
import { CommunityExplorePageMasonrySection } from "./CommunityExplorePageMasonrySection";
import { CommunityExplorePageTopicsSection } from "./CommunityExplorePageTopicsSection";
import type { CommunityExplorePageViewModel } from "./useCommunityExplorePage";

export function CommunityExplorePageMain({ vm }: { vm: CommunityExplorePageViewModel }) {
  const { t } = vm;

  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      aria-label={t("community_explore_title")}
      data-tt-community-explore-page="1"
    >
      <CommunityExplorePageHeader {...vm} />
      <CommunityExplorePageTopicsSection {...vm} />
      <CommunityExplorePageMasonrySection {...vm} />
      <CommunityExplorePageAuthorsSection {...vm} />
      <CommunityExplorePageDestinationsSection {...vm} />
    </main>
  );
}
