"use client";

import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import ViewSwitcher from "@/components/market/ViewSwitcher";
import OrderCard from "@/components/market/OrderCard";
import type { OrderCardItem } from "@/components/market/OrderCard";
import GuideCard from "@/components/market/GuideCard";
import type { GuideCardItem } from "@/components/market/GuideCard";
import EmptyState from "@/components/market/EmptyState";
import { OrderCardSkeleton, GuideCardSkeleton } from "@/components/market/MarketSkeleton";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { trackMarketEvent } from "@/lib/analytics";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type MarketSortBy = "latest" | "priceDesc" | "priceAsc";

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
  filteredOrders: OrderCardItem[];
  guides: GuideCardItem[];
  orders: OrderCardItem[];
  hasFilters: boolean;
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
  resetFilters: () => void;
}

export default function MarketContent({
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
  filteredOrders,
  guides,
  orders,
  hasFilters,
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
  resetFilters,
}: MarketContentProps) {
  const { t } = useTranslation();
  const marketOrdersHeadingId = useId();
  const marketGuidesHeadingId = useId();
  const hasApiError = apiErrorOrders != null || apiErrorGuides != null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
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
                className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-ink-800 text-small font-medium disabled:opacity-60 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <ViewSwitcher value={view} onChange={setView} glass />
        <div className="flex items-center gap-2" role="group" aria-label={t("market_sort_label")}>
          <span className="text-meta font-medium text-white/80">{t("market_sort_label")}</span>
          <div className="flex flex-wrap gap-1.5">
            {(["latest", "priceDesc", "priceAsc"] as const).map((value) => (
              <form
                key={value}
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSortBy(value);
                }}
              >
                <button
                  type="submit"
                  className={`${touchTargetLink44Classes} rounded-full px-3 py-1.5 text-meta font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    sortBy === value
                      ? "bg-ref-cyan/25 border-ref-cyan/55 text-white ring-1 ring-ref-coral/20 shadow-[0_0_16px_-4px_rgba(35,206,217,0.25)]"
                      : "bg-white/10 border-white/20 text-white/80 hover:bg-white/14 hover:border-ref-cyan/25"
                  }`}
                >
                  {t(value === "latest" ? "market_sort_latest" : value === "priceDesc" ? "market_sort_priceDesc" : "market_sort_priceAsc")}
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-busy={loadingOrders || loadingGuides ? true : undefined}>
        {showOrders && (
          <section
            className={view === "orders" ? "lg:col-span-12" : "lg:col-span-7"}
            aria-labelledby={marketOrdersHeadingId}
            aria-busy={loadingOrders ? true : undefined}
          >
            <h2 id={marketOrdersHeadingId} className="text-body font-semibold text-white mb-3 drop-shadow-market-section">{t("market_orders_heading")}</h2>
            {loadingOrders ? (
              <OrderCardSkeleton
                count={view === "orders" ? 6 : 4}
                gridClass={view === "orders" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}
              />
            ) : filteredOrders.length === 0 ? (
              apiErrorOrders != null ? (
                <div
                  className="rounded-[var(--radius-lg)] border border-warning/45 bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 p-6 ring-1 ring-warning/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
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
                      className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ref-cyan/40 bg-ref-cyan/15 px-4 py-2 text-small font-medium text-white hover:bg-ref-cyan/25 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
                    >
                      {loadingOrders ? t("common_retrying") : t("common_retry")}
                    </button>
                  </form>
                </div>
              ) : hasFilters ? (
                <div className="rounded-[var(--radius-lg)] border border-white/15 bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 p-6 ring-1 ring-ref-cyan/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <EmptyState kind="no-matches" onResetFilters={resetFilters} darkBg />
                </div>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-white/15 bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 p-6 ring-1 ring-ref-cyan/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <EmptyState kind="no-orders" darkBg />
                </div>
              )
            ) : (
              <>
                <ul className={`grid gap-4 list-none p-0 m-0 ${view === "orders" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                  {filteredOrders.map((item) => (
                    <li key={item.id}>
                      <OrderCard
                        item={item}
                        onGrabOrder={(id) => {
                          trackMarketEvent("market_order_click", { orderId: id });
                          const o = orders.find((x) => x.id === id) ?? null;
                          setDetailOrder(o);
                        }}
                        onViewDetail={(id) => {
                          trackMarketEvent("market_order_click", { orderId: id });
                          const o = orders.find((x) => x.id === id) ?? null;
                          setDetailOrder(o);
                        }}
                        isFavorited={favoritedOrderIds.has(item.id)}
                        onToggleFavorite={toggleOrderFavorite}
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
                        className={`${touchTargetLink44Classes} rounded-full border border-ref-cyan/35 bg-white/10 px-5 py-2.5 text-small font-medium text-white backdrop-blur-md backdrop-saturate-150 hover:bg-ref-cyan/15 hover:border-ref-coral/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed`}
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
            className={view === "guides" ? "lg:col-span-12" : "lg:col-span-5"}
            aria-labelledby={marketGuidesHeadingId}
            aria-busy={loadingGuides ? true : undefined}
          >
            <h2 id={marketGuidesHeadingId} className="text-body font-semibold text-white mb-3 drop-shadow-market-section">{t("market_guides_heading")}</h2>
            {loadingGuides ? (
              <GuideCardSkeleton
                count={view === "guides" ? 6 : 3}
                gridClass={view === "guides" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}
              />
            ) : guides.length === 0 ? (
              apiErrorGuides != null ? (
                <div
                  className="rounded-[var(--radius-lg)] border border-warning/45 bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 p-6 ring-1 ring-warning/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
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
                      className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ref-cyan/40 bg-ref-cyan/15 px-4 py-2 text-small font-medium text-white hover:bg-ref-cyan/25 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
                    >
                      {loadingGuides ? t("common_retrying") : t("common_retry")}
                    </button>
                  </form>
                </div>
              ) : hasFilters ? (
                <div className="rounded-[var(--radius-lg)] border border-white/15 bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 p-6 ring-1 ring-fuchsia-400/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <EmptyState kind="no-matches" onResetFilters={resetFilters} darkBg />
                </div>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-white/15 bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 p-6 ring-1 ring-fuchsia-400/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <EmptyState kind="no-guides" onResetFilters={resetFilters} darkBg />
                </div>
              )
            ) : (
              <ul className={`grid gap-4 list-none p-0 m-0 ${view === "guides" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {guides.map((g) => (
                  <li key={g.id}>
                    <GuideCard
                      guide={g}
                      onView={(id) => {
                        trackMarketEvent("market_guide_click", { guideId: id });
                        const guide = guides.find((x) => x.id === id) ?? null;
                        setDetailGuide(guide);
                      }}
                      onBookGuide={(id) => {
                        trackMarketEvent("market_guide_click", { guideId: id });
                        const guide = guides.find((x) => x.id === id);
                        setBookGuideId(id);
                        setBookGuideName(guide ? (guide.city ? t("guide_card_cityGuide").replace("{{city}}", guide.city) : t("guide_card_guide")) : null);
                      }}
                      isFavorited={favoritedGuideIds.has(g.id)}
                      onToggleFavorite={toggleGuideFavorite}
                      glass
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
