import { type FormEvent } from "react";
import type { CommunityPostType } from "@/lib/communityMockData";
import type { FeedTab, SortBy, RegionKey } from "./communityFeedConstants";
import { DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type CommunityFeedFilterBarSummaryProps = {
  t: LocaleTranslateFn;
  feedTab: FeedTab;
  sortBy: SortBy;
  regionFilter: RegionKey;
  destinationFilter: string;
  typeFilter: CommunityPostType | "all";
  tagFilter: string | null;
  tagTopicMatchCount?: number;
  searchQuery: string;
  onClearFilters: () => void;
};

export function CommunityFeedFilterBarSummary({
  t,
  feedTab,
  sortBy,
  regionFilter,
  destinationFilter,
  typeFilter,
  tagFilter,
  tagTopicMatchCount,
  searchQuery,
  onClearFilters,
}: CommunityFeedFilterBarSummaryProps) {
  return (
    <div className={`${TT_COMMUNITY_FEED_ACTION.filterSummaryShell} flex flex-wrap items-center gap-2`}>
      <span className="text-meta text-slate-400">{t("community_filter_current")}:</span>
      <span className="text-meta text-slate-300">
        {[
          feedTab === "following" ? t("community_feed_following") : t("community_feed_recommend"),
          sortBy === "hot" ? t("community_sort_hot") : t("community_sort_latest"),
          regionFilter !== "all" ? t(`community_region_${regionFilter}`) : null,
          destinationFilter !== "all"
            ? DESTINATION_LABEL_KEYS[destinationFilter]
              ? t(DESTINATION_LABEL_KEYS[destinationFilter])
              : destinationFilter
            : null,
          typeFilter !== "all" ? t(`community_type_${typeFilter}`) : null,
          tagFilter
            ? `#${tagFilter}${
                typeof tagTopicMatchCount === "number"
                  ? ` · ${t("community_tag_topic_count").replace("{{count}}", String(tagTopicMatchCount))}`
                  : ""
              }`
            : null,
          searchQuery.trim()
            ? `「${searchQuery.trim().slice(0, 12)}${searchQuery.trim().length > 12 ? "…" : ""}」`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      <form
        className="ml-auto inline"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          onClearFilters();
        }}
      >
        <button
          type="submit"
          className={`${TT_COMMUNITY_FEED_ACTION.filterClearPill} ${communitySlatePillFocus}`}
        >
          {t("community_filter_clear")}
        </button>
      </form>
    </div>
  );
}
