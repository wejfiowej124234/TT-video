"use client";

import Link from "next/link";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { communityTopicPathForTag } from "@/lib/communityFeedSortUrl";
import { EXPLORE_TOPIC_LINKS } from "./communityExplorePageConstants";
import type { CommunityExplorePageViewModel } from "./useCommunityExplorePage";

export function CommunityExplorePageTopicsSection(vm: CommunityExplorePageViewModel) {
  const { t, exploreTopicsHeadingId } = vm;

  return (
    <section
      className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-800/70 backdrop-blur-md p-4 mb-4"
      aria-labelledby={exploreTopicsHeadingId}
    >
      <h2 id={exploreTopicsHeadingId} className="text-body font-semibold text-slate-200 mb-3">
        {t("community_explore_section_topics")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {EXPLORE_TOPIC_LINKS.map(({ pathTag, labelKey }) => (
          <Link
            key={pathTag}
            href={communityTopicPathForTag(pathTag, "latest")}
            className={`rounded-full border border-ref-sun/35 bg-ink-700/60 px-3 py-1.5 text-meta text-ref-sun/90 hover:text-ref-sun hover:bg-ref-sun/15 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
          >
            #{t(labelKey)}
          </Link>
        ))}
      </div>
    </section>
  );
}
