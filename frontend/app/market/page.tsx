"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { MarketRouteSuspense } from "@/components/market";
import { useMarketPage } from "@/components/market/useMarketPage";
import MarketAmbientBackdrop from "@/components/market/MarketAmbientBackdrop";
import MarketHubSubNav from "@/components/market/MarketHubSubNav";
import StickyFilterBar from "@/components/market/StickyFilterBar";
import MarketPageHero from "@/components/market/MarketPageHero";
import MarketContent from "@/components/market/MarketContent";
import MarketPageFooter from "@/components/market/MarketPageFooter";
import OrderDetailDrawer from "@/components/market/OrderDetailDrawer";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import GuideDetailDrawer from "@/components/market/GuideDetailDrawer";
import BookGuideModal from "@/components/market/BookGuideModal";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";

const CustomItineraryModal = dynamic(
  () => import("@/components/market/CustomItineraryModal").then((m) => m.default),
  { ssr: false, loading: () => null }
);

const MARKET_BASE = "/market";

/** P29 自由市场主入口（旅行预约）；`/market/provider`、`/market/acquisition` 为独立子页。 */
function MarketPageInner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderDrawerLoginReturnPath = useMemo(
    () => buildLoginReturnPathWithQuery(pathname, searchParams.toString(), MARKET_BASE),
    [pathname, searchParams],
  );
  const data = useMarketPage();

  return (
    <main
      className="relative min-h-screen"
      aria-label={t("market_hero_title")}
      data-testid="market-page"
    >
      <MarketAmbientBackdrop />

      <div className="relative z-10 isolate min-h-screen">
        <MarketPageHero
          onCustomItineraryClick={() => data.setCustomItineraryOpen(true)}
          customItineraryLabel={t("market_customItinerary")}
        />
        <div className="flex justify-center px-4 mt-3">
          <div className="w-full max-w-4xl">
            <MarketHubSubNav />
          </div>
        </div>
        {data.communityGuideDeepLinkNotFound ? (
          <div className="relative z-10 px-4 mt-3 flex justify-center" role="status" aria-live="polite">
            <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-warning/45 bg-warning/15 px-4 py-3 text-small text-ink-900">
              <p className="min-w-0 flex-1">{t("market_community_guide_deep_link_not_found")}</p>
              <button
                type="button"
                onClick={() => data.dismissCommunityGuideDeepLinkMiss()}
                className={`${touchTargetLink44Classes} shrink-0 rounded-[var(--radius-sm)] border border-ink-300 bg-white/90 px-3 py-2 text-meta font-medium text-ink-800 hover:bg-white ${travelFocusRingOffset2Classes}`}
              >
                {t("market_community_guide_deep_link_dismiss")}
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex justify-center px-4 mt-3">
          <div className="w-full max-w-4xl rounded-[var(--radius-md)] overflow-hidden shadow-[0_0_40px_-10px_rgba(35,206,217,0.12)] bg-white/[0.07] backdrop-blur-md border border-white/20 ring-1 ring-ref-cyan/20">
            <StickyFilterBar
              country={data.country}
              city={data.city}
              languages={data.languages}
              serviceTypes={data.serviceTypes}
              onCountryChange={data.setCountry}
              onCityChange={data.setCity}
              onLanguagesChange={data.setLanguages}
              onServiceTypesChange={data.setServiceTypes}
              glass
            />
          </div>
        </div>

        <MarketContent
          view={data.view}
          setView={data.setView}
          sortBy={data.sortBy}
          setSortBy={data.setSortBy}
          loadingOrders={data.loadingOrders}
          loadingGuides={data.loadingGuides}
          apiErrorOrders={data.apiErrorOrders}
          apiErrorGuides={data.apiErrorGuides}
          apiErrorDismissed={data.apiErrorDismissed}
          setApiErrorDismissed={data.setApiErrorDismissed}
          loadOrders={data.loadOrders}
          loadMoreOrders={data.loadMoreOrders}
          ordersHasMore={data.ordersHasMore}
          loadingMoreOrders={data.loadingMoreOrders}
          loadGuides={data.loadGuides}
          filteredOrders={data.sortedOrders}
          guides={data.sortedGuides}
          orders={data.orders}
          hasFilters={data.hasFilters}
          showOrders={data.showOrders}
          showGuides={data.showGuides}
          favoritedOrderIds={data.favoritedOrderIds}
          favoritedGuideIds={data.favoritedGuideIds}
          toggleOrderFavorite={data.toggleOrderFavorite}
          toggleGuideFavorite={data.toggleGuideFavorite}
          setDetailOrder={data.setDetailOrder}
          setDetailGuide={data.setDetailGuide}
          setBookGuideId={data.setBookGuideId}
          setBookGuideName={data.setBookGuideName}
          resetFilters={data.resetFilters}
        />

        <MarketPageFooter />
      </div>

      <OrderDetailDrawer
        order={data.detailOrder}
        onClose={() => data.setDetailOrder(null)}
        onConfirmAccept={data.handleConfirmAccept}
        loginReturnPath={orderDrawerLoginReturnPath}
      />
      <GuideDetailDrawer
        guide={data.detailGuide}
        onClose={() => data.setDetailGuide(null)}
        onInvite={data.detailGuide ? () => {
          data.setBookGuideId(data.detailGuide!.id);
          data.setBookGuideName(formatGuideDisplayName(t, data.detailGuide!));
          data.setDetailGuide(null);
        } : undefined}
      />

      {data.bookGuideId && (
        <BookGuideModal
          guideId={data.bookGuideId}
          guideName={data.bookGuideName ?? undefined}
          onClose={() => { data.setBookGuideId(null); data.setBookGuideName(null); }}
        />
      )}

      <CustomItineraryModal
        open={data.customItineraryOpen}
        onClose={() => data.setCustomItineraryOpen(false)}
        onSuccess={data.handleCustomItinerarySubmit}
        preselectedGuideId={data.customItineraryPreselectedGuideId || undefined}
      />

      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex w-[min(100vw-2rem,28rem)] flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {(() => {
          const acceptOid = data.acceptSuccessOrderId;
          if (!data.acceptSuccessToast || acceptOid == null || acceptOid === "") return null;
          return (
            <div
              className="rounded-[var(--radius-md)] border border-success/45 bg-bg-console px-4 py-3 text-small font-medium text-ink-900 shadow-strong animate-in fade-in duration-200 pointer-events-auto"
              role="status"
            >
              <p>{t("market_acceptSuccess")}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-meta font-normal">
                <Link
                  href={`/escrow/${encodeURIComponent(acceptOid)}`}
                  onClick={() => stashEscrowOrderPrefetchForOrderIdNav(acceptOid, "escrow")}
                  className={`text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                >
                  {t("orders_viewDetail")}
                </Link>
                <Link
                  href={`/pay?orderId=${encodeURIComponent(acceptOid)}`}
                  onClick={() => stashEscrowOrderPrefetchForOrderIdNav(acceptOid, "pay")}
                  className={`text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                >
                  {t("orders_payHub")}
                </Link>
              </div>
            </div>
          );
        })()}
        {(() => {
          if (!data.customCreatedToast) return null;
          const customOid = data.customCreatedOrderId;
          return (
            <div
              className="rounded-[var(--radius-md)] border border-travel-500/50 bg-bg-console px-4 py-3 text-small font-medium text-ink-900 shadow-strong animate-in fade-in duration-200 pointer-events-auto"
              role="status"
            >
              <p>{t("market_customCreated")}</p>
              {customOid != null && customOid !== "" ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-meta font-normal">
                  <Link
                    href={`/escrow/${encodeURIComponent(customOid)}`}
                    onClick={() => stashEscrowOrderPrefetchForOrderIdNav(customOid, "escrow")}
                    className={`text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                  >
                    {t("orders_viewDetail")}
                  </Link>
                  <Link
                    href={`/pay?orderId=${encodeURIComponent(customOid)}`}
                    onClick={() => stashEscrowOrderPrefetchForOrderIdNav(customOid, "pay")}
                    className={`text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                  >
                    {t("orders_payHub")}
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })()}
      </div>
    </main>
  );
}

export default function MarketPage() {
  return (
    <MarketRouteSuspense>
      <MarketPageInner />
    </MarketRouteSuspense>
  );
}
