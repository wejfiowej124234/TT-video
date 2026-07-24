import { type FormEvent } from "react";
import type { CommunityPostType } from "@/lib/communityMockData";
import type { RegionKey } from "./communityFeedConstants";
import { TYPE_OPTIONS } from "./communityFeedConstants";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

const chipClass = (active: boolean) =>
  `${TT_COMMUNITY_FEED_ACTION.filterChipBase} ${communityCyanPillFocus} ${
    active ? TT_COMMUNITY_FEED_ACTION.filterChipActive : TT_COMMUNITY_FEED_ACTION.filterChipIdle
  }`;

export type CommunityFeedFilterBarChipFiltersProps = {
  t: LocaleTranslateFn;
  chipFiltersRegionId: string;
  filtersExpanded: boolean;
  typeFilter: CommunityPostType | "all";
  setTypeFilter: (v: CommunityPostType | "all") => void;
  /** Kept for call-site compatibility; geo chips removed (HU-035). */
  regionFilter: RegionKey;
  setRegionFilter: (v: RegionKey) => void;
  destinationFilter: string;
  setDestinationFilter: (v: string) => void;
  hotDestinations: string[];
};

/** Type chips only — destination geo is DestinationPicker SSOT (HU-035). */
export function CommunityFeedFilterBarChipFilters({
  t,
  chipFiltersRegionId,
  filtersExpanded,
  typeFilter,
  setTypeFilter,
}: CommunityFeedFilterBarChipFiltersProps) {
  return (
    <div
      id={chipFiltersRegionId}
      className={`mb-3 space-y-3 lg:mb-4 ${filtersExpanded ? "block" : "hidden lg:block"}`}
    >
      <div className="-mx-3 px-3 overflow-x-auto overflow-y-hidden scrollbar-hide" aria-label={t("community_filter_type_aria")}>
        <div className="flex gap-2 pb-1 min-w-max">
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setTypeFilter("all");
            }}
          >
            <button type="submit" className={chipClass(typeFilter === "all")}>
              {t("community_type_all")}
            </button>
          </form>
          {TYPE_OPTIONS.map((type) => (
            <form
              key={type}
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setTypeFilter(type);
              }}
            >
              <button type="submit" className={chipClass(typeFilter === type)}>
                {t(`community_type_${type}`)}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
