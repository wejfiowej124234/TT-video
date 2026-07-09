"use client";

import { useTranslation } from "@/components/LocaleProvider";
import OrderCard from "@/components/market/OrderCard";
import type { OrderCardItem } from "@/components/market/OrderCard";
import EmptyState from "@/components/market/EmptyState";
import { OrderCardSkeleton } from "@/components/market/MarketSkeleton";
import { trackMarketEvent } from "@/lib/analytics";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const D = TT_MARKETING_MARKET_DARK_PATH;
import { MARKET_TRAVEL_SHOWCASE_ORDERS } from "@/lib/marketMockData";
import { marketPublicShowcaseFallbackEnabled } from "@/lib/marketPublicDisplayGate";
import { resolveMarketOrderForDetail } from "./marketContentModel";

type View = "split" | "orders" | "guides";

type Props = {
  marketOrdersHeadingId: string;
  view: View;
  showOrders: boolean;
  loadingOrders: boolean;
  filteredOrders: OrderCardItem[];
  orders: OrderCardItem[];
  apiErrorOrders: string | null;
  hasFilters: boolean;
  loadOrders: () => void;
  loadMoreOrders: () => void;
  ordersHasMore: boolean;
  loadingMoreOrders: boolean;
  favoritedOrderIds: Set<string>;
  toggleOrderFavorite: (id: string) => void;
  setDetailOrder: (o: OrderCardItem | null) => void;
  resetFilters: () => void;
};

export function MarketContentOrdersSection({
  marketOrdersHeadingId,
  view,
  showOrders,
  loadingOrders,
  filteredOrders,
  orders,
  apiErrorOrders,
  hasFilters,
  loadOrders,
  loadMoreOrders,
  ordersHasMore,
  loadingMoreOrders,
  favoritedOrderIds,
  toggleOrderFavorite,
  setDetailOrder,
  resetFilters,
}: Props) {
  const { t } = useTranslation();
  if (!showOrders) return null;

  const resolveOrder = (id: string) => resolveMarketOrderForDetail(orders, id);

  return (
    <section
      className={view === "orders" ? "lg:col-span-12" : "lg:col-span-7"}
      aria-labelledby={marketOrdersHeadingId}
      aria-busy={loadingOrders ? true : undefined}
    >
      <h2 id={marketOrdersHeadingId} className="text-body font-semibold text-white mb-3 drop-shadow-market-section">
        {t("market_orders_heading")}
      </h2>
      {showOrders && filteredOrders.length === 0 && !loadingOrders && !hasFilters && marketPublicShowcaseFallbackEnabled() ? (
        <div
          className={D.marketGlassInsetPanelShowcase}
          role="region"
          aria-label={t("market_travel_showcase_aria")}
        >
          <div className="mb-3">
            <h3 className="text-small font-semibold text-white tracking-wide">{t("market_travel_showcase_title")}</h3>
            <p className="text-meta text-white/65 mt-1 leading-relaxed">{t("market_travel_showcase_hint")}</p>
          </div>
          <ul
            className={`list-none m-0 p-0 gap-4 grid ${
              view === "split" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {MARKET_TRAVEL_SHOWCASE_ORDERS.map((item) => (
              <li key={item.id} className="flex min-h-0 min-w-0 h-full">
                <OrderCard
                  item={item}
                  onGrabOrder={(id) => {
                    trackMarketEvent("market_order_click", { orderId: id });
                    setDetailOrder(resolveOrder(id));
                  }}
                  onViewDetail={(id) => {
                    trackMarketEvent("market_order_click", { orderId: id });
                    setDetailOrder(resolveOrder(id));
                  }}
                  isFavorited={favoritedOrderIds.has(item.id)}
                  onToggleFavorite={toggleOrderFavorite}
                  glass
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
        ) : hasFilters ? (
          <div className={D.marketGlassInsetPanel}>
            <EmptyState kind="no-matches" onResetFilters={resetFilters} darkBg />
          </div>
        ) : (
          <div className={D.marketGlassInsetPanel}>
            <EmptyState kind="no-orders" darkBg />
          </div>
        )
      ) : (
        <>
          <ul className={`grid gap-4 list-none p-0 m-0 ${view === "orders" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
            {filteredOrders.map((item) => (
              <li key={item.id} className="flex min-h-0 min-w-0 h-full">
                <OrderCard
                  item={item}
                  onGrabOrder={(id) => {
                    trackMarketEvent("market_order_click", { orderId: id });
                    setDetailOrder(resolveOrder(id));
                  }}
                  onViewDetail={(id) => {
                    trackMarketEvent("market_order_click", { orderId: id });
                    setDetailOrder(resolveOrder(id));
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
  );
}
