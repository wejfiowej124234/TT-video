"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import StickyFilterBar from "@/components/market/StickyFilterBar";
import type { MarketView } from "@/components/market/ViewSwitcher";
import { formatMarketTravelFilterSummaryBlocks } from "@/lib/marketTravelFilterSummary";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type MarketTravelSortBy = "latest" | "priceDesc" | "priceAsc";

export type MarketTravelFilterPanelProps = {
  country: string;
  city: string;
  languages: string[];
  serviceTypes: string[];
  onCountryChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onLanguagesChange: (values: string[]) => void;
  onServiceTypesChange: (values: string[]) => void;
  onReset: () => void;
  view: MarketView;
  sortBy: MarketTravelSortBy;
  orderCount: number;
  guideCount: number;
  loadingOrders: boolean;
  loadingGuides: boolean;
  /** 接口异常且未关闭提示时，附在摘要后（与演示子站「数据口径」一致） */
  summaryUnavailableNote?: string | null;
  /** 星标与账户/本机关系说明（与社区帖子收藏区分）；见 `market_favorites_sync_note` */
  favoritesSyncHint?: string | null;
  /** 已登录但拉取 `GET …/me/market-bookmarks` 失败时的说明（保留本机星标，可能与账户不一致） */
  bookmarkSyncAlert?: string | null;
  onBookmarkSyncRetry?: () => void;
  /** 星标写入/删除接口失败（本地已回滚） */
  favoriteToggleAlert?: string | null;
  onFavoriteToggleAlertDismiss?: () => void;
};

export default function MarketTravelFilterPanel({
  country,
  city,
  languages,
  serviceTypes,
  onCountryChange,
  onCityChange,
  onLanguagesChange,
  onServiceTypesChange,
  onReset,
  view,
  sortBy,
  orderCount,
  guideCount,
  loadingOrders,
  loadingGuides,
  summaryUnavailableNote,
  favoritesSyncHint,
  bookmarkSyncAlert,
  onBookmarkSyncRetry,
  favoriteToggleAlert,
  onFavoriteToggleAlertDismiss,
}: MarketTravelFilterPanelProps) {
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
    <div className="flex flex-col" data-testid="market-travel-filter-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="text-small font-semibold uppercase tracking-wide text-cyan-200">
          {t("market_subsite_filter_band_title")}
        </span>
        <button
          type="button"
          onClick={onReset}
          className={`${touchTargetLink44Classes} text-meta font-medium text-white/90 underline decoration-amber-400/50 underline-offset-4 hover:text-white ${travelFocusRingCoreOffset2Classes}`}
        >
          {t("market_subsite_filter_reset")}
        </button>
      </div>
      <StickyFilterBar
        country={country}
        city={city}
        languages={languages}
        serviceTypes={serviceTypes}
        onCountryChange={onCountryChange}
        onCityChange={onCityChange}
        onLanguagesChange={onLanguagesChange}
        onServiceTypesChange={onServiceTypesChange}
        glass
      />
      <div
        className="flex min-h-[3.25rem] flex-col justify-center gap-1 border-t border-white/10 px-4 py-2 sm:min-h-[2.75rem]"
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
            <p className="text-meta leading-snug text-slate-400">{summaryBlocks.filterLine}</p>
            <p className="text-small font-medium leading-snug text-slate-100">
              {summaryBlocks.listLine}
              {summaryUnavailableNote ? (
                <span className="font-normal text-slate-400"> {summaryUnavailableNote}</span>
              ) : null}
            </p>
            {favoritesSyncHint ? (
              <p className="text-meta leading-snug text-slate-500" data-testid="market-favorites-sync-hint">
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
    </div>
  );
}
