/** @deprecated 由 `CommunityFeedFilterBar` 内联 Tab 取代；保留类型兼容。勿恢复使用。 */
import { type FormEvent } from "react";
import type { FeedTab, SortBy } from "./communityFeedConstants";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

export type CommunityFeedFilterBarTabsProps = {
  t: LocaleTranslateFn;
  feedTab: FeedTab;
  setFeedTab: (v: FeedTab) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
};

export function CommunityFeedFilterBarTabs({
  t,
  feedTab,
  setFeedTab,
  sortBy,
  setSortBy,
}: CommunityFeedFilterBarTabsProps) {
  return (
    <div className={TT_COMMUNITY_FEED_ACTION.feedTabBar} role="tablist" aria-label={t("community_title")}>
      {(["recommend", "following"] as const).map((tab) => (
        <form
          key={tab}
          className="contents"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setFeedTab(tab);
          }}
        >
          <button
            type="submit"
            role="tab"
            aria-selected={feedTab === tab}
            className={`text-body motion-sub ${TT_COMMUNITY_FEED_ACTION.feedTabFocus} ${
              feedTab === tab ? TT_COMMUNITY_FEED_ACTION.feedTabActive : TT_COMMUNITY_FEED_ACTION.feedTabIdle
            }`}
          >
            {t(tab === "recommend" ? "community_feed_recommend" : "community_feed_following")}
          </button>
        </form>
      ))}
      <div className="ml-auto flex gap-1.5">
        {(["latest", "hot"] as const).map((s) => (
          <form
            key={s}
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setSortBy(s);
            }}
          >
            <button
              type="submit"
              className={`${TT_COMMUNITY_FEED_ACTION.sortChipBase} ${communityCyanPillFocus} ${
                sortBy === s ? TT_COMMUNITY_FEED_ACTION.sortChipActive : TT_COMMUNITY_FEED_ACTION.sortChipIdle
              }`}
            >
              {t(s === "latest" ? "community_sort_latest" : "community_sort_hot")}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
