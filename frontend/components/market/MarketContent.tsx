"use client";

import { memo, useCallback, useId, useDeferredValue, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { MarketContentViewSortBar } from "@/components/market/MarketContentViewSortBar";
import OrderCard from "@/components/market/OrderCard";
import type { OrderCardItem } from "@/components/market/OrderCard";
import GuideCard from "@/components/market/GuideCard";
import type { GuideCardItem } from "@/components/market/GuideCard";
import EmptyState from "@/components/market/EmptyState";
import { OrderCardSkeleton, GuideCardSkeleton } from "@/components/market/MarketSkeleton";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { trackMarketEvent } from "@/lib/analytics";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_BTN_MARKET_PRIMARY_PILL,
  TT_MARKETING_MARKET_DARK_PATH,
  TT_MARKETING_MARKET_L5_CONTENT_BRIDGE,
  TT_MARKETING_MARKET_L5_PAGE_MAX,
  TT_MARKETING_HOME_SECTION_BRIDGE_LINE,
} from "@/lib/marketingUi";
import { resolveMarketOrderForDetail } from "@/components/market/marketContentModel";
import { bindingOrderVisibleInList, isOwnPublishedOpenListing } from "@/lib/marketBindOrderList";
import { AUTH_USER_ID_KEY } from "@/lib/apiClient/core";

export type MarketSortBy = "latest" | "priceDesc" | "priceAsc";

const D = TT_MARKETING_MARKET_DARK_PATH;

export interface MarketContentProps {
  view: "split" | "orders" | "guides";
  setView: (v: "split" | "orders" | "guides") => void;
  sortBy: MarketSortBy;
  setSortBy: (v: MarketSortBy) => void;
  loadingOrders: boolean;
  loadingGuides: boolean;
  /** 非 null 表示对应列表拉取失败（已为本地化全文） */
  apiErrorOrders: string | null;
  apiErrorGuides: string | null;
  apiErrorDismissed: boolean;
  setApiErrorDismissed: (v: boolean) => void;
  loadOrders: () => void;
  loadMoreOrders: () => void;
  ordersHasMore: boolean;
  loadingMoreOrders: boolean;
  loadGuides: () => void;
  loadMoreGuides: () => void;
  guidesHasMore: boolean;
  loadingMoreGuides: boolean;
  filteredOrders: OrderCardItem[];
  guides: GuideCardItem[];
  orders: OrderCardItem[];
  hasFilters: boolean;
  hasGuideFilters: boolean;
  showOrders: boolean;
  showGuides: boolean;
  favoritedOrderIds: Set<string>;
  favoritedGuideIds: Set<string>;
  toggleOrderFavorite: (id: string) => void;
  toggleGuideFavorite: (id: string) => void;
  setDetailOrder: (o: OrderCardItem | null) => void;
  setDetailGuide: (g: GuideCardItem | null) => void;
  setBookGuideId: (id: string | null) => void;
  setBookGuideName: (name: string | null) => void;
  /** Escrow 草稿绑定向导深链（含单/多笔「我的订单」自动/手选目标） */
  bindGuideToOrderId?: string;
  selectedOwnBindingOrderId?: string;
  onSelectOwnBindingOrderId?: (id: string) => void;
  hasOwnPublishedOpenOrders?: boolean;
  multipleOwnPublishedOpenOrders?: boolean;
  resetFilters: () => void;
  tripDaysFilter?: number | null;
  onClearTripDaysFilter?: () => void;
  onCustomItineraryClick?: () => void;
}

function MarketContent({
  view,
  setView,
  sortBy,
  setSortBy,
  loadingOrders,
  loadingGuides,
  apiErrorOrders,
  apiErrorGuides,
  apiErrorDismissed,
  setApiErrorDismissed,
  loadOrders,
  loadMoreOrders,
  ordersHasMore,
  loadingMoreOrders,
  loadGuides,
  loadMoreGuides,
  guidesHasMore,
  loadingMoreGuides,
  filteredOrders,
  guides,
  orders,
  hasFilters,
  hasGuideFilters,
  showOrders,
  showGuides,
  favoritedOrderIds,
  favoritedGuideIds,
  toggleOrderFavorite,
  toggleGuideFavorite,
  setDetailOrder,
  setDetailGuide,
  setBookGuideId,
  setBookGuideName,
  bindGuideToOrderId = "",
  selectedOwnBindingOrderId = "",
  onSelectOwnBindingOrderId,
  hasOwnPublishedOpenOrders = false,
  multipleOwnPublishedOpenOrders = false,
  resetFilters,
  tripDaysFilter = null,
  onClearTripDaysFilter,
  onCustomItineraryClick,
}: MarketContentProps) {
  const { t } = useTranslation();
  const marketOrdersHeadingId = useId();
  const marketGuidesHeadingId = useId();
  const hasApiError = apiErrorOrders != null || apiErrorGuides != null;
  const bindId = bindGuideToOrderId.trim();
  const bindPinVisible = bindId ? bindingOrderVisibleInList(filteredOrders, bindId) : true;
  const pickerSelectedId = selectedOwnBindingOrderId.trim() || bindId;
  const ordersGridClass =
    view === "orders"
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";
  const compactColumnEmpty = view === "split";

  const handleOwnOrderSelect = useCallback(
    (item: OrderCardItem) => {
      if (typeof window === "undefined") return;
      const ownId = localStorage.getItem(AUTH_USER_ID_KEY)?.trim() ?? "";
      if (!isOwnPublishedOpenListing(item, ownId)) return;
      onSelectOwnBindingOrderId?.(String(item.id));
    },
    [onSelectOwnBindingOrderId],
  );

  const openOrderDetail = useCallback(
    (id: string) => {
      trackMarketEvent("market_order_click", { orderId: id });
      const pool = filteredOrders.length > 0 ? filteredOrders : orders;
      const row = resolveMarketOrderForDetail(pool, id);
      handleOwnOrderSelect(row);
      setDetailOrder(row);
    },
    [filteredOrders, orders, setDetailOrder, handleOwnOrderSelect],
  );

  const deferredFilteredOrders = useDeferredValue(filteredOrders);
  const deferredGuides = useDeferredValue(guides);

  const openGuideDetail = useCallback(
    (id: string) => {
      trackMarketEvent("market_guide_click", { guideId: id });
      const guide = guides.find((x) => x.id === id) ?? null;
      setDetailGuide(guide);
    },
    [guides, setDetailGuide],
  );

  const bookGuideHandler = useMemo(() => {
    const canBook =
      bindGuideToOrderId.trim() ||
      pickerSelectedId.trim() ||
      (hasOwnPublishedOpenOrders && !multipleOwnPublishedOpenOrders);
    if (!canBook) return undefined;
    return (id: string) => {
      trackMarketEvent("market_guide_click", { guideId: id });
      const guide = guides.find((x) => x.id === id);
      setBookGuideId(id);
      setBookGuideName(guide ? formatGuideDisplayName(t, guide) : null);
    };
  }, [
    bindGuideToOrderId,
    pickerSelectedId,
    hasOwnPublishedOpenOrders,
    multipleOwnPublishedOpenOrders,
    guides,
    setBookGuideId,
    setBookGuideName,
    t,
  ]);

  const bookGuideLabelKey = useMemo(() => {
    if (bindGuideToOrderId.trim() || pickerSelectedId.trim()) return "book_guide_bindSelect";
    if (hasOwnPublishedOpenOrders && !multipleOwnPublishedOpenOrders) return "book_guide_bindSelect";
    if (hasOwnPublishedOpenOrders) return "book_guide_bindSelect_need_pick";
    return "guide_card_book";
  }, [
    bindGuideToOrderId,
    pickerSelectedId,
    hasOwnPublishedOpenOrders,
    multipleOwnPublishedOpenOrders,
  ]);

  return (
    <div className={`${TT_MARKETING_MARKET_L5_PAGE_MAX} px-4 py-5`}>
      <div className={TT_MARKETING_MARKET_L5_CONTENT_BRIDGE} aria-hidden>
        <div className={TT_MARKETING_HOME_SECTION_BRIDGE_LINE} />
      </div>
      {hasApiError && !apiErrorDismissed && (
        <div
          className="mb-4 rounded-[var(--radius-sm)] border border-ink-200/70 bg-bg-console/98 shadow-soft px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          role="status"
          aria-live="polite"
        >
          <div className="min-w-0 flex-1 space-y-2">
            {apiErrorOrders != null && apiErrorGuides != null ? (
              <>
                <p className="text-small font-medium text-ink-900">{t("market_apiError_both")}</p>
                <ApiErrorAlert message={apiErrorOrders} />
                <ApiErrorAlert message={apiErrorGuides} />
              </>
            ) : (
              <ApiErrorAlert message={apiErrorOrders ?? apiErrorGuides} />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                if (apiErrorOrders != null) loadOrders();
                if (apiErrorGuides != null) loadGuides();
              }}
            >
              <button
                type="submit"
                disabled={loadingOrders || loadingGuides}
                className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY_PILL} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loadingOrders || loadingGuides ? t("common_retrying") : t("common_retry")}
              </button>
            </form>
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                setApiErrorDismissed(true);
              }}
            >
              <button
                type="submit"
                disabled={loadingOrders || loadingGuides}
                aria-busy={loadingOrders || loadingGuides ? true : undefined}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-60 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                aria-label={t("common_closeAlert")}
              >
                ✕
              </button>
            </form>
          </div>
        </div>
      )}
      <MarketContentViewSortBar view={view} setP29View={setView} sortBy={sortBy} setSortBy={setSortBy} />

      <div className="grid grid-cols-1 items-start lg:grid-cols-12 gap-6" aria-busy={loadingOrders || loadingGuides ? true : undefined}>
        {showOrders && (
          <section
            className={view === "orders" ? "lg:col-span-12" : "lg:col-span-7"}
            aria-labelledby={marketOrdersHeadingId}
            aria-busy={loadingOrders ? true : undefined}
          >
            <div className="mb-3 flex min-h-[2.75rem] flex-wrap items-end justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h2 id={marketOrdersHeadingId} className="text-body font-semibold text-white px-0 drop-shadow-market-section">
                  {t("market_orders_heading")}
                </h2>
                {filteredOrders.length > 0 ? (
                  <span className="rounded-full border border-ref-sun/28 bg-ref-sun/10 px-2 py-0.5 text-meta font-semibold text-ref-sun [color:var(--ref-sun)]">
                    {filteredOrders.length}
                  </span>
                ) : null}
                {hasOwnPublishedOpenOrders ? (
                  <span className="rounded-full border border-ref-coral/35 bg-ref-coral/12 px-2 py-0.5 text-meta font-semibold text-ref-coral [color:var(--ref-coral)]">
                    {t("market_own_binding_order_badge")}
                  </span>
                ) : null}
              </div>
              {tripDaysFilter != null ? (
                <p className="text-meta text-ref-sun/90" role="status">
                  {t("market_trip_days_filter_active").replace("{{n}}", String(tripDaysFilter))}
                  {onClearTripDaysFilter ? (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={onClearTripDaysFilter}
                        className={`${touchTargetLink44Classes} font-medium text-ref-sun underline decoration-ref-sun/45 underline-offset-4 hover:text-ref-sun/95 ${TT_MARKETING_MARKET_DARK_PATH.drawerControlFocus}`}
                      >
                        {t("market_trip_days_filter_clear")}
                      </button>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
            {loadingOrders ? (
              <OrderCardSkeleton
                count={view === "orders" ? 6 : 4}
                gridClass={view === "orders" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}
              />
            ) : filteredOrders.length === 0 ? (
              apiErrorOrders != null ? (
                <div
                  className={D.marketApiErrorPanel}
                  role="region"
                  aria-label={t("market_orders_loadFailed_title")}
                >
                  <p className="text-body font-semibold text-white mb-2">{t("market_orders_loadFailed_title")}</p>
                  <p className="text-small text-white/90 leading-relaxed" role="alert">
                    {apiErrorOrders}
                  </p>
                  <form
                    className="mt-4 inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      loadOrders();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={loadingOrders}
                      aria-busy={loadingOrders ? true : undefined}
                      className={`${touchTargetLink44Classes} ${D.marketRetryBtn}`}
                    >
                      {loadingOrders ? t("common_retrying") : t("common_retry")}
                    </button>
                  </form>
                </div>
              ) : bindId && !bindPinVisible ? (
                <div className={D.marketGlassInsetPanel}>
                  <EmptyState
                    kind="bind-order-missing"
                    bindEscrowOrderId={bindId}
                    onResetFilters={hasFilters ? resetFilters : undefined}
                    darkBg
                    compactColumn={compactColumnEmpty}
                  />
                </div>
              ) : hasFilters ? (
                <div className={D.marketGlassInsetPanel}>
                  <EmptyState kind="no-matches" onResetFilters={resetFilters} darkBg compactColumn={compactColumnEmpty} />
                </div>
              ) : (
                <div className={D.marketGlassInsetPanel}>
                  <EmptyState kind="no-orders" darkBg onCustomItineraryClick={onCustomItineraryClick} compactColumn={compactColumnEmpty} />
                </div>
              )
            ) : (
              <>
                <ul className={`grid gap-4 list-none p-0 m-0 [content-visibility:auto] ${ordersGridClass}`}>
                  {deferredFilteredOrders.map((item, index) => (
                    <li key={item.id}>
                      <OrderCard
                        item={item}
                        onGrabOrder={openOrderDetail}
                        onViewDetail={openOrderDetail}
                        isFavorited={favoritedOrderIds.has(item.id)}
                        onToggleFavorite={toggleOrderFavorite}
                        coverEager={index < 3}
                        bindingOrderId={bindGuideToOrderId || pickerSelectedId || undefined}
                        isSelectedBindingTarget={
                          Boolean(pickerSelectedId) && String(item.id) === pickerSelectedId
                        }
                        glass
                      />
                    </li>
                  ))}
                </ul>
                {ordersHasMore && orders.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        loadMoreOrders();
                      }}
                    >
                      <button
                        type="submit"
                        disabled={loadingMoreOrders || loadingOrders}
                        aria-busy={loadingMoreOrders ? true : undefined}
                        className={`${touchTargetLink44Classes} ${D.marketLoadMorePill}`}
                      >
                        {loadingMoreOrders ? t("common_loadingMore") : t("common_loadMore")}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {showGuides && (
          <section
            id="market-guides-section"
            className={view === "guides" ? "lg:col-span-12" : "lg:col-span-5"}
            aria-labelledby={marketGuidesHeadingId}
            aria-busy={loadingGuides ? true : undefined}
          >
            <div className="mb-3 flex min-h-[2.75rem] flex-wrap items-end gap-2">
              <h2 id={marketGuidesHeadingId} className="text-body font-semibold text-white px-0 drop-shadow-market-section">
                {t("market_guides_heading")}
              </h2>
              {guides.length > 0 ? (
                <span className="rounded-full border border-ref-sun/28 bg-ref-sun/10 px-2 py-0.5 text-meta font-semibold text-ref-sun [color:var(--ref-sun)]">
                  {guides.length}
                </span>
              ) : null}
            </div>
            {loadingGuides ? (
              <GuideCardSkeleton
                count={view === "guides" ? 6 : 3}
                gridClass={view === "guides" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}
              />
            ) : guides.length === 0 ? (
              apiErrorGuides != null ? (
                <div
                  className={D.marketApiErrorPanel}
                  role="region"
                  aria-label={t("market_guides_loadFailed_title")}
                >
                  <p className="text-body font-semibold text-white mb-2">{t("market_guides_loadFailed_title")}</p>
                  <p className="text-small text-white/90 leading-relaxed" role="alert">
                    {apiErrorGuides}
                  </p>
                  <form
                    className="mt-4 inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      loadGuides();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={loadingGuides}
                      aria-busy={loadingGuides ? true : undefined}
                      className={`${touchTargetLink44Classes} ${D.marketRetryBtn}`}
                    >
                      {loadingGuides ? t("common_retrying") : t("common_retry")}
                    </button>
                  </form>
                </div>
              ) : hasGuideFilters ? (
                <div className={D.marketGlassInsetPanel}>
                  <EmptyState kind="no-matches" onResetFilters={resetFilters} darkBg compactColumn={compactColumnEmpty} />
                </div>
              ) : hasOwnPublishedOpenOrders ? (
                <div className={D.marketGlassInsetPanel}>
                  <EmptyState
                    kind="no-guides-pick-for-order"
                    onResetFilters={resetFilters}
                    darkBg
                    multipleOwnOrders={multipleOwnPublishedOpenOrders}
                    compactColumn={compactColumnEmpty}
                  />
                </div>
              ) : (
                <div className={D.marketGlassInsetPanel}>
                  <EmptyState kind="no-guides" onResetFilters={resetFilters} darkBg compactColumn={compactColumnEmpty} />
                </div>
              )
            ) : (
              <>
                <ul className={`grid gap-4 list-none p-0 m-0 [content-visibility:auto] ${view === "guides" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {deferredGuides.map((g, index) => (
                    <li key={g.id}>
                      <GuideCard
                        guide={g}
                        onView={openGuideDetail}
                        onBookGuide={bookGuideHandler}
                        bookGuideLabelKey={bookGuideLabelKey}
                        isFavorited={favoritedGuideIds.has(g.id)}
                        onToggleFavorite={toggleGuideFavorite}
                        coverEager={index < 3}
                        glass
                      />
                    </li>
                  ))}
                </ul>
                {guidesHasMore && guides.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        loadMoreGuides();
                      }}
                    >
                      <button
                        type="submit"
                        disabled={loadingMoreGuides || loadingGuides}
                        aria-busy={loadingMoreGuides ? true : undefined}
                        className={`${touchTargetLink44Classes} ${D.marketLoadMorePill}`}
                      >
                        {loadingMoreGuides ? t("common_loadingMore") : t("common_loadMore")}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default memo(MarketContent);
