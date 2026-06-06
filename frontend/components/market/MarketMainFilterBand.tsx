"use client";

import { memo, useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import StickyFilterBar from "@/components/market/StickyFilterBar";
import MarketTravelFilterSummaryStrip from "@/components/market/MarketTravelFilterSummaryStrip";
import type { MarketView } from "@/components/market/ViewSwitcher";
import type { MarketPageSortKey } from "@/lib/marketPageQuery";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH, TT_MARKETING_MARKET_L5_PAGE_MAX } from "@/lib/marketingUi";

const D = TT_MARKETING_MARKET_DARK_PATH;

export type MarketMainFilterBandProps = {
  country: string;
  city: string;
  languages: string[];
  serviceTypes: string[];
  tripDaysFilter: number | null;
  filterExpanded: boolean;
  onFilterExpandedChange: (open: boolean) => void;
  onCountryChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onLanguagesChange: (values: string[]) => void;
  onServiceTypesChange: (values: string[]) => void;
  onTripDaysFilterClear: () => void;
  onResetFilters: () => void;
  hasFilters: boolean;
  view: MarketView;
  sortBy: MarketPageSortKey;
  orderCount: number;
  guideCount: number;
  loadingOrders: boolean;
  loadingGuides: boolean;
  ownPublishedGeoBypass: boolean;
  favoritesSyncHint?: string | null;
  bookmarkSyncAlert?: string | null;
  onBookmarkSyncRetry?: () => void;
  favoriteToggleAlert?: string | null;
  onFavoriteToggleAlertDismiss?: () => void;
};

/** `/market` 主站筛选带 SSOT（band · 高级筛选 · 摘要 · 重置）— 布局冻结见 MARKET-FILTER-SORT-UI-FREEZE.md */
function MarketMainFilterBand(props: MarketMainFilterBandProps) {
  const { t } = useTranslation();
  const bandId = useId();

  return (
    <div
      className={`${TT_MARKETING_MARKET_L5_PAGE_MAX} ${D.marketFilterBarShell}`}
      data-testid="market-main-filter-band"
      data-tt-market-filter-band="frozen"
      aria-labelledby={bandId}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b ${D.marketFilterPanelDivider} px-3 py-2 sm:px-4 sm:py-2.5`}
      >
        <h2 id={bandId} className={D.filterBandTitle}>
          {t("market_subsite_filter_band_title")}
        </h2>
        <button
          type="button"
          onClick={props.onResetFilters}
          disabled={!props.hasFilters}
          className={`${touchTargetLink44Classes} ${D.marketFilterResetLink} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-ref-sun/22`}
        >
          {t("market_subsite_filter_reset")}
        </button>
      </div>
      <StickyFilterBar
        country={props.country}
        city={props.city}
        languages={props.languages}
        serviceTypes={props.serviceTypes}
        tripDaysFilter={props.tripDaysFilter}
        onTripDaysFilterClear={props.onTripDaysFilterClear}
        filterExpanded={props.filterExpanded}
        onFilterExpandedChange={props.onFilterExpandedChange}
        onCountryChange={props.onCountryChange}
        onCityChange={props.onCityChange}
        onLanguagesChange={props.onLanguagesChange}
        onServiceTypesChange={props.onServiceTypesChange}
        glass
      />
      <MarketTravelFilterSummaryStrip
        country={props.country}
        city={props.city}
        languages={props.languages}
        serviceTypes={props.serviceTypes}
        view={props.view}
        sortBy={props.sortBy}
        orderCount={props.orderCount}
        guideCount={props.guideCount}
        loadingOrders={props.loadingOrders}
        loadingGuides={props.loadingGuides}
        ownPublishedGeoBypass={props.ownPublishedGeoBypass}
        favoritesSyncHint={props.favoritesSyncHint}
        bookmarkSyncAlert={props.bookmarkSyncAlert}
        onBookmarkSyncRetry={props.onBookmarkSyncRetry}
        favoriteToggleAlert={props.favoriteToggleAlert}
        onFavoriteToggleAlertDismiss={props.onFavoriteToggleAlertDismiss}
      />
    </div>
  );
}

export default memo(MarketMainFilterBand);
