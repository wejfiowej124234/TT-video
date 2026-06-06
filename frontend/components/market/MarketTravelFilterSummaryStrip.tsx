"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import type { MarketView } from "@/components/market/ViewSwitcher";
import { formatMarketTravelFilterSummaryBlocks } from "@/lib/marketTravelFilterSummary";
import type { MarketPageSortKey } from "@/lib/marketPageQuery";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

const D = TT_MARKETING_MARKET_DARK_PATH;

export type MarketTravelFilterSummaryStripProps = {
  country: string;
  city: string;
  languages: string[];
  serviceTypes: string[];
  view: MarketView;
  sortBy: MarketPageSortKey;
  orderCount: number;
  guideCount: number;
  loadingOrders: boolean;
  loadingGuides: boolean;
  ownPublishedGeoBypass?: boolean;
  favoritesSyncHint?: string | null;
  bookmarkSyncAlert?: string | null;
  onBookmarkSyncRetry?: () => void;
  favoriteToggleAlert?: string | null;
  onFavoriteToggleAlertDismiss?: () => void;
};

export default function MarketTravelFilterSummaryStrip({
  country,
  city,
  languages,
  serviceTypes,
  view,
  sortBy,
  orderCount,
  guideCount,
  loadingOrders,
  loadingGuides,
  ownPublishedGeoBypass = false,
  favoritesSyncHint,
  bookmarkSyncAlert,
  onBookmarkSyncRetry,
  favoriteToggleAlert,
  onFavoriteToggleAlertDismiss,
}: MarketTravelFilterSummaryStripProps) {
  const { t } = useTranslation();
  const loading = loadingOrders || loadingGuides;
  const summaryBlocks = useMemo(
    () =>
      formatMarketTravelFilterSummaryBlocks(t, {
        country,
        city,
        languages,
        serviceTypes,
        view,
        sortBy,
        orderCount,
        guideCount,
      }),
    [t, country, city, languages, serviceTypes, view, sortBy, orderCount, guideCount],
  );

  return (
    <div
      className={`flex min-h-[2.25rem] flex-col justify-center gap-0.5 border-t ${D.marketFilterPanelDivider} px-3 py-2 sm:px-4`}
      data-testid="market-travel-filter-summary"
    >
      {loading ? (
        <div aria-busy="true">
          <span className="sr-only">{t("market_travel_filter_summary_loading_sr")}</span>
          <div
            className="h-4 w-full max-w-xl rounded bg-ink-700/70 motion-safe:animate-pulse motion-reduce:animate-none"
            aria-hidden
          />
        </div>
      ) : (
        <div className="text-left text-pretty" aria-live="polite" aria-atomic="true">
          <p className={`${D.filterSummaryFilterLine} leading-snug`}>
            {summaryBlocks.filterLine}
            <span className="mx-1.5 text-slate-500/80" aria-hidden>
              ·
            </span>
            <span className={D.filterSummaryListLine}>{summaryBlocks.listLine}</span>
          </p>
          {ownPublishedGeoBypass ? (
            <p className={`${D.filterSummaryBypassHint} mt-0.5`} role="note">
              {t("market_filter_own_published_geo_bypass_hint")}
            </p>
          ) : null}
          {favoritesSyncHint ? (
            <p className="text-meta leading-snug text-slate-500 mt-0.5" data-testid="market-favorites-sync-hint">
              {favoritesSyncHint}
            </p>
          ) : null}
          {bookmarkSyncAlert ? (
            <div
              className="mt-1 flex flex-col gap-2 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
              data-testid="market-bookmarks-sync-alert"
            >
              <p className="text-meta leading-snug text-white/95 min-w-0">{bookmarkSyncAlert}</p>
              {onBookmarkSyncRetry ? (
                <button
                  type="button"
                  data-tt-market-bookmarks-sync-retry="1"
                  onClick={onBookmarkSyncRetry}
                  className={`shrink-0 self-start sm:self-center rounded-[var(--radius-sm)] border border-warning/45 bg-warning/40 px-3 py-2 text-meta font-medium text-white hover:bg-warning/60 motion-sub ${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes}`}
                >
                  {t("market_bookmarks_sync_retry")}
                </button>
              ) : null}
            </div>
          ) : null}
          {favoriteToggleAlert ? (
            <div
              className="mt-1 flex flex-col gap-2 rounded-[var(--radius-sm)] border border-rose-400/35 bg-rose-950/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              role="status"
              data-testid="market-favorite-toggle-alert"
            >
              <p className="text-meta leading-snug text-rose-50/95 min-w-0">{favoriteToggleAlert}</p>
              {onFavoriteToggleAlertDismiss ? (
                <button
                  type="button"
                  onClick={onFavoriteToggleAlertDismiss}
                  className={`shrink-0 self-start sm:self-center rounded-[var(--radius-sm)] border border-rose-300/45 bg-rose-900/35 px-3 py-2 text-meta font-medium text-rose-50 hover:bg-rose-900/55 motion-sub ${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes}`}
                >
                  {t("common_close")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
