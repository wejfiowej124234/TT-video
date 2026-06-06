"use client";

import Link from "next/link";
import { DESTINATION_LABEL_KEYS } from "@/components/community/communityFeedConstants";
import { communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";
import type { CommunityExplorePageViewModel } from "./useCommunityExplorePage";

export function CommunityExplorePageDestinationsSection(vm: CommunityExplorePageViewModel) {
  const { t, exploreDestHeadingId, regionBlocks, exploreDestCatalog } = vm;

  return (
    <section
      id="explore-destinations"
      data-tt-community-explore-dest-catalog={exploreDestCatalog}
      className="rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-800/70 backdrop-blur-md p-4 mb-4 [content-visibility:auto]"
      aria-labelledby={exploreDestHeadingId}
      aria-describedby="explore-dest-catalog-hint"
    >
      <h2 id={exploreDestHeadingId} className="text-body font-semibold text-slate-200 mb-3">
        {t("community_explore_section_destinations")}
      </h2>
      <p id="explore-dest-catalog-hint" className="sr-only">
        {exploreDestCatalog === "api-aggregate-v1"
          ? t("community_explore_dest_catalog_api_hint")
          : t("community_explore_dest_catalog_static_hint")}
      </p>
      {/* 88 §3.4 / 31：热门目的地采用 flex-wrap 多行换行（非横向滚动），窄屏可读优先 */}
      <div className="space-y-4">
        {regionBlocks.map(({ regionKey, destinations }) => (
          <div key={regionKey}>
            <h3 className="text-meta font-medium text-slate-400 mb-2">{t(`community_region_${regionKey}`)}</h3>
            <div className="flex flex-wrap gap-2">
              {destinations.map((d) => (
                <Link
                  key={d}
                  href={`/community?destination=${encodeURIComponent(d)}`}
                  className={`rounded-full border border-ref-sun/32 bg-ref-sun/10 px-3 py-1.5 text-meta text-ref-sun/95 hover:bg-ref-sun/12 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${communityFuchsiaPillFocus}`}
                >
                  {DESTINATION_LABEL_KEYS[d] ? t(DESTINATION_LABEL_KEYS[d]) : d}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
