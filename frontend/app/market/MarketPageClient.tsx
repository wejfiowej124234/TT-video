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
import MarketMainFilterBand from "@/components/market/MarketMainFilterBand";
import MarketPageHero from "@/components/market/MarketPageHero";
import {
  ColdStartCampaignSurfaceSection,
  COLD_START_SURFACE_MARKET_FEED,
} from "@/components/coldStartCampaign/ColdStartCampaignSurfaceSection";
import MarketFlowContextBanner from "@/components/market/MarketFlowContextBanner";
import MarketContent from "@/components/market/MarketContent";
import { ConversionFunnelRail } from "@/components/product-enhancement/ConversionFunnelRail";
import { MarketOrderClosureStrip } from "@/components/product-enhancement/MarketOrderClosureStrip";
import MarketPageFooter from "@/components/market/MarketPageFooter";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { formatTripRangeLabel } from "@/lib/guideBookingDates";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import { resolveMarketBackdropSurface } from "@/lib/marketingDarkPremiumBg";
import {
  TT_MARKETING_HOME_AMBIENT_GLOW,
  TT_MARKETING_HOME_DOT_GRID,
  TT_MARKETING_HOME_SECTION_BRIDGE,
  TT_MARKETING_HOME_SECTION_BRIDGE_LINE,
  TT_MARKETING_MARKET_CONTENT_GAP,
  TT_MARKETING_MARKET_DARK_PATH,
  TT_MARKETING_MARKET_FILTER_GAP,
  TT_MARKETING_MARKET_HUB_GAP,
  TT_MARKETING_MARKET_L5_PAGE_MAX,
} from "@/lib/marketingUi";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import type { MarketPageInitialSnapshot } from "@/lib/market/marketPageInitialData";
import {
  buildMarketHubDiscoverOrdersQuery,
  buildMarketHubGuidesQuery,
  marketHubEffectiveCountry,
} from "@/lib/marketHubBrowserTruth";

const CustomItineraryModal = dynamic(
  () => import("@/components/market/CustomItineraryModal").then((m) => m.default),
  { ssr: false, loading: () => null }
);
const AuthRequiredModal = dynamic(
  () => import("@/components/shared/AuthRequiredModal"),
  { ssr: false, loading: () => null },
);

const OrderDetailDrawer = dynamic(
  () => import("@/components/market/OrderDetailDrawer").then((m) => m.default),
  { ssr: false, loading: () => null }
);

const GuideDetailDrawer = dynamic(
  () => import("@/components/market/GuideDetailDrawer").then((m) => m.default),
  { ssr: false, loading: () => null }
);

const BookGuideModal = dynamic(
  () => import("@/components/market/BookGuideModal").then((m) => m.default),
  { ssr: false, loading: () => null }
);

const MARKET_BASE = "/market";

/** P29 自由市场主入口（旅行预约）；`/market/provider`、`/market/acquisition` 为独立子页。 */
function MarketPageInner({ initialSnapshot }: { initialSnapshot?: MarketPageInitialSnapshot | null }) {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderDrawerLoginReturnPath = useMemo(
    () => buildLoginReturnPathWithQuery(pathname, searchParams.toString(), MARKET_BASE),
    [pathname, searchParams],
  );
  const hasListFilters = useMemo(() => {
    return Boolean(
      searchParams.get("country") ||
        searchParams.get("city") ||
        searchParams.get("language") ||
        searchParams.get("service") ||
        searchParams.get("days") ||
        (searchParams.get("view") && searchParams.get("view") !== "split"),
    );
  }, [searchParams]);
  const data = useMarketPage({
    initialSnapshot: hasListFilters ? null : initialSnapshot ?? null,
  });
  const hubCountry = marketHubEffectiveCountry(data.country);
  const hubOrdersQuery = useMemo(
    () =>
      buildMarketHubDiscoverOrdersQuery({
        country: data.country,
        city: data.city,
        tripDaysFilter: data.tripDaysFilter,
      }),
    [data.country, data.city, data.tripDaysFilter],
  );
  const hubGuidesQuery = useMemo(
    () =>
      buildMarketHubGuidesQuery({
        country: data.country,
        city: data.city,
        languages: data.languages,
        serviceTypes: data.serviceTypes,
      }),
    [data.country, data.city, data.languages, data.serviceTypes],
  );
  const marketDarkSurface = resolveMarketBackdropSurface();

  return (
    <main
      className="relative min-h-screen"
      aria-label={t("market_hero_title")}
      data-testid="market-page"
      data-tt-market-page="1"
      data-tt-market-l5="1"
      data-tt-market-ui-thaw="closed"
      data-tt-market-filter-sort-frozen="1"
      data-tt-market-favorites-mode="localstorage-f020-sync-v1"
      data-tt-market-dark-surface={marketDarkSurface}
      data-tt-market-country={hubCountry}
      data-tt-market-orders-query={hubOrdersQuery}
      data-tt-market-guides-query={hubGuidesQuery}
    >
      <MarketAmbientBackdrop />
      <div className="absolute inset-0 z-0 bg-experience-landing-vignette pointer-events-none" aria-hidden />
      <div className={TT_MARKETING_HOME_AMBIENT_GLOW} aria-hidden />
      <div className={TT_MARKETING_HOME_DOT_GRID} aria-hidden />

      <div className="relative z-10 isolate min-h-screen">
        <MarketPageHero
          onCustomItineraryClick={data.openCustomItinerary}
          onTripDaysFilter={data.applyTripDaysFilter}
          selectedTripDays={data.tripDaysFilter}
          customItineraryLabel={t("market_customItinerary")}
        />
        <ColdStartCampaignSurfaceSection
          surface={COLD_START_SURFACE_MARKET_FEED}
          className={`${TT_MARKETING_MARKET_L5_PAGE_MAX} relative z-10 mt-2`}
        />
        <div className={TT_MARKETING_HOME_SECTION_BRIDGE} aria-hidden>
          <div className={TT_MARKETING_HOME_SECTION_BRIDGE_LINE} />
        </div>
        <div className={TT_MARKETING_MARKET_HUB_GAP}>
          <div className={TT_MARKETING_MARKET_L5_PAGE_MAX}>
            <MarketHubSubNav />
          </div>
        </div>
        <div
          className={`${TT_MARKETING_MARKET_HUB_GAP} relative z-10`}
          data-tt-market-pes-chrome="quiet"
        >
          <div className={`${TT_MARKETING_MARKET_L5_PAGE_MAX} space-y-2`}>
            {/* Quiet PES: next-CTA only + order-closure strip (trust micro off default viewport) */}
            <ConversionFunnelRail touchpoint="market" t={t} density="quiet" />
            <MarketOrderClosureStrip t={t} />
          </div>
        </div>
        {!data.bindGuideToOrderId ? (
          <div className={`${TT_MARKETING_MARKET_HUB_GAP} relative z-10`}>
            <MarketFlowContextBanner
              mode={data.hasOwnPublishedOpenOrders ? "own-published" : "browse"}
              ownPublishedCount={data.ownPublishedOpenCount}
              multipleOwnOrders={data.multipleOwnPublishedOpenOrders}
            />
          </div>
        ) : null}
        {data.bindOrderBackfillError ? (
          <div className="relative z-10 px-4 mt-3 flex justify-center" role="alert" aria-live="polite">
            <div className={`${TT_MARKETING_MARKET_L5_PAGE_MAX} flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-warning/45 bg-ink-900/72 backdrop-blur-md px-4 py-3 ring-1 ring-warning/20`}>
              <p className="min-w-0 flex-1 text-small text-slate-100">{data.bindOrderBackfillError}</p>
              <button
                type="button"
                onClick={() => data.dismissBindOrderBackfillError()}
                className={`${touchTargetLink44Classes} shrink-0 rounded-[var(--radius-sm)] border border-ink-300 bg-white/90 px-3 py-2 text-meta font-medium text-ink-800 hover:bg-white ${travelFocusRingOffset2Classes}`}
              >
                {t("common_close")}
              </button>
            </div>
          </div>
        ) : null}
        {data.bindGuideToOrderId ? (
          <div className="relative z-10 px-4 mt-3 flex justify-center" role="status">
            <div className={`${TT_MARKETING_MARKET_L5_PAGE_MAX} ${TT_MARKETING_MARKET_DARK_PATH.bindGuideBanner}`}>
              <p className={TT_MARKETING_MARKET_DARK_PATH.bindGuideBannerTitle}>
                {t("market_bindGuide_banner")}
              </p>
              <p className={TT_MARKETING_MARKET_DARK_PATH.bindGuideBannerSub}>
                {t("market_bindGuide_bannerSub")}
              </p>
              {data.bindOrderTripDates ? (
                <p className="text-small text-ref-sun/90 mt-2">
                  {t("market_bindGuide_tripLabel").replace(
                    "{{range}}",
                    formatTripRangeLabel(
                      data.bindOrderTripDates.start,
                      data.bindOrderTripDates.end,
                      locale,
                    ),
                  )}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/escrow/${encodeURIComponent(data.bindGuideToOrderId)}`}
                  className={`${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.bindGuideBannerCta}`}
                >
                  {t("market_bindGuide_back_escrow")}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
        {data.communityGuideDeepLinkNotFound ? (
          <div className="relative z-10 px-4 mt-3 flex justify-center" role="status" aria-live="polite">
            <div className={`${TT_MARKETING_MARKET_L5_PAGE_MAX} flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-warning/45 bg-ink-900/72 backdrop-blur-md px-4 py-3 ring-1 ring-warning/20`}>
              <p className="min-w-0 flex-1 text-small text-slate-100">{t("market_community_guide_deep_link_not_found")}</p>
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
        <div className={TT_MARKETING_MARKET_FILTER_GAP}>
          <MarketMainFilterBand
            country={data.country}
            city={data.city}
            languages={data.languages}
            serviceTypes={data.serviceTypes}
            tripDaysFilter={data.tripDaysFilter}
            filterExpanded={data.filterExpanded}
            onFilterExpandedChange={data.setFilterExpanded}
            onCountryChange={data.setCountry}
            onCityChange={data.setCity}
            onLanguagesChange={data.setLanguages}
            onServiceTypesChange={data.setServiceTypes}
            onTripDaysFilterClear={data.clearTripDaysFilter}
            onResetFilters={data.resetFilters}
            hasFilters={data.hasFilters}
            view={data.view}
            sortBy={data.sortBy}
            orderCount={data.filteredOrders.length}
            guideCount={data.sortedGuides.length}
            loadingOrders={data.loadingOrders}
            loadingGuides={data.loadingGuides}
            ownPublishedGeoBypass={data.ownPublishedGeoBypass}
            favoritesSyncHint={data.favoritesSyncHint}
            bookmarkSyncAlert={data.bookmarkSyncAlert}
            onBookmarkSyncRetry={data.onBookmarkSyncRetry}
            favoriteToggleAlert={data.favoriteToggleAlert}
            onFavoriteToggleAlertDismiss={data.onFavoriteToggleAlertDismiss}
          />
        </div>

        <div className={TT_MARKETING_MARKET_CONTENT_GAP}>
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
          loadMoreGuides={data.loadMoreGuides}
          guidesHasMore={data.guidesHasMore}
          loadingMoreGuides={data.loadingMoreGuides}
          filteredOrders={data.filteredOrders}
          guides={data.sortedGuides}
          orders={data.orders}
          hasFilters={data.hasFilters}
          hasGuideFilters={data.hasGuideFilters}
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
          bindGuideToOrderId={data.effectiveBindGuideToOrderId}
          selectedOwnBindingOrderId={data.selectedOwnBindingOrderId}
          onSelectOwnBindingOrderId={data.setSelectedOwnBindingOrderId}
          hasOwnPublishedOpenOrders={data.hasOwnPublishedOpenOrders}
          multipleOwnPublishedOpenOrders={data.multipleOwnPublishedOpenOrders}
          resetFilters={data.resetFilters}
          tripDaysFilter={data.tripDaysFilter}
          onClearTripDaysFilter={data.clearTripDaysFilter}
          onCustomItineraryClick={data.openCustomItinerary}
        />
        </div>

        <MarketPageFooter />
      </div>

      {data.detailOrder ? (
        <OrderDetailDrawer
          order={data.detailOrder}
          onClose={() => data.setDetailOrder(null)}
          onConfirmAccept={data.handleConfirmAccept}
          loginReturnPath={orderDrawerLoginReturnPath}
        />
      ) : null}
      {data.detailGuide ? (
        <GuideDetailDrawer
          guide={data.detailGuide}
          bindGuideToOrderId={data.effectiveBindGuideToOrderId || undefined}
          onClose={() => data.setDetailGuide(null)}
          onInvite={() => {
            data.setBookGuideId(data.detailGuide!.id);
            data.setBookGuideName(formatGuideDisplayName(t, data.detailGuide!));
            data.setDetailGuide(null);
          }}
        />
      ) : null}

      {data.bookGuideId && (
        <BookGuideModal
          guideId={data.bookGuideId}
          guideName={data.bookGuideName ?? undefined}
          bindOrderId={data.effectiveBindGuideToOrderId || undefined}
          tripStart={data.bindOrderTripDates?.start}
          tripEnd={data.bindOrderTripDates?.end}
          onClose={() => { data.setBookGuideId(null); data.setBookGuideName(null); }}
        />
      )}

      <CustomItineraryModal
        open={data.customItineraryOpen}
        onClose={data.closeCustomItinerary}
        onSuccess={data.handleCustomItinerarySubmit}
        preselectedGuideId={data.customItineraryPreselectedGuideId || undefined}
        initialTotalDays={data.customItineraryInitialDays}
      />
      <AuthRequiredModal
        open={data.authRequiredOpen}
        onClose={data.clearAuthRequired}
        returnUrl={orderDrawerLoginReturnPath}
        messageKey="landing_error_login"
        testId="market-auth-required-modal"
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
          return (
            <div
              className="rounded-[var(--radius-md)] border border-travel-500/50 bg-bg-console px-4 py-3 text-small font-medium text-ink-900 shadow-strong animate-in fade-in duration-200 pointer-events-auto"
              role="status"
            >
              <p>{t("market_customCreated")}</p>
            </div>
          );
        })()}
      </div>
    </main>
  );
}

export default function MarketPageClient({
  initialSnapshot = null,
}: {
  initialSnapshot?: MarketPageInitialSnapshot | null;
}) {
  return (
    <MarketRouteSuspense>
      <MarketPageInner initialSnapshot={initialSnapshot} />
    </MarketRouteSuspense>
  );
}
