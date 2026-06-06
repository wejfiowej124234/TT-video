import { type FormEvent } from "react";
import type { CommunityPostType } from "@/lib/communityMockData";
import type { RegionKey } from "./communityFeedConstants";
import { TYPE_OPTIONS, REGION_KEYS } from "./communityFeedConstants";
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
  regionFilter: RegionKey;
  setRegionFilter: (v: RegionKey) => void;
  destinationFilter: string;
  setDestinationFilter: (v: string) => void;
  hotDestinations: string[];
};

export function CommunityFeedFilterBarChipFilters({
  t,
  chipFiltersRegionId,
  filtersExpanded,
  typeFilter,
  setTypeFilter,
  regionFilter,
  setRegionFilter,
  destinationFilter,
  setDestinationFilter,
  hotDestinations,
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
            <button
              type="submit"
              className={chipClass(typeFilter === "all")}
            >
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
              <button
                type="submit"
                className={chipClass(typeFilter === type)}
              >
                {t(`community_type_${type}`)}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="-mx-3 px-3 overflow-x-auto overflow-y-hidden scrollbar-hide" aria-label={t("community_region_filter")}>
        <div className="flex gap-2 pb-1 min-w-max">
          {REGION_KEYS.map((key) => (
            <form
              key={key}
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setRegionFilter(key);
                setDestinationFilter("all");
              }}
            >
              <button
                type="submit"
                className={chipClass(regionFilter === key)}
              >
                {t(`community_region_${key}`)}
              </button>
            </form>
          ))}
        </div>
      </div>

      {hotDestinations.length > 0 && (
        <div className="-mx-3 px-3 overflow-x-auto overflow-y-hidden scrollbar-hide" aria-label={t("community_hot_destinations")}>
          <div className="flex gap-2 pb-1 min-w-max">
            <form
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setDestinationFilter("all");
              }}
            >
              <button
                type="submit"
                className={chipClass(destinationFilter === "all")}
              >
                {t("community_destination_all")}
              </button>
            </form>
            {hotDestinations.map((d) => (
              <form
                key={d}
                className="contents"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  setDestinationFilter(d);
                }}
              >
                <button
                  type="submit"
                  className={chipClass(destinationFilter === d)}
                >
                  {d}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
