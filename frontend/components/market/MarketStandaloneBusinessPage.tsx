"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import MarketAmbientBackdrop from "@/components/market/MarketAmbientBackdrop";
import MarketHeroFrame from "@/components/market/MarketHeroFrame";
import MarketHeroTrustPills from "@/components/market/MarketHeroTrustPills";
import MarketHubSubNav from "@/components/market/MarketHubSubNav";
import MarketPageFooter from "@/components/market/MarketPageFooter";
import MarketSubsiteFilterBar from "@/components/market/MarketSubsiteFilterBar";
import MarketSubsiteListFooterStrip from "@/components/market/MarketSubsiteListFooterStrip";
import AcquisitionPublishReadinessPanel from "@/components/market/AcquisitionPublishReadinessPanel";
import AcquisitionSubsiteStatsPanel from "@/components/market/AcquisitionSubsiteStatsPanel";
import MarketSubsiteMasonry from "@/components/market/MarketSubsiteMasonry";
import { MarketSubsiteListingDetailDrawer } from "@/components/market/MarketSubsiteListingDetailDrawer";
import LoadingText from "@/components/LoadingText";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { useMarketStandaloneBusinessPage } from "@/components/market/useMarketStandaloneBusinessPage";
import { resolveRegisterBackPath } from "@/app/auth/register/registerPageModel";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_BTN_MARKET_PRIMARY,
  TT_MARKETING_MARKET_DARK_PATH,
  TT_MARKETING_MARKET_PAGE_H1_COMPACT,
} from "@/lib/marketingUi";

const MerchantShowcaseStudioModal = dynamic(
  () => import("@/components/market/MerchantShowcaseStudioModal").then((m) => m.default),
  { ssr: false, loading: () => null },
);
const AcquisitionCarryStudioModal = dynamic(
  () => import("@/components/market/AcquisitionCarryStudioModal").then((m) => m.default),
  { ssr: false, loading: () => null },
);

/** 独立子站：`/market/provider` · `/market/acquisition`（瀑布流演示 + 创作台 + 详情抽屉） */
export default function MarketStandaloneBusinessPage({ variant }: { variant: "provider" | "acquisition" }) {
  const page = useMarketStandaloneBusinessPage(variant);
  const searchParams = useSearchParams();
  const identitiesBackHref = useMemo(() => {
    const raw = searchParams.get("returnUrl");
    if (!raw) return null;
    return resolveRegisterBackPath(raw, "acquisition");
  }, [searchParams]);
  const { t } = page;
  const isProvider = variant === "provider";
  const title = isProvider ? t("market_segment_provider_title") : t("market_segment_acquisition_title");
  const desc = isProvider ? t("market_segment_provider_desc") : t("market_segment_acquisition_desc");
  const testId = isProvider ? "market-provider-page" : "market-acquisition-page";
  const listLabelKey = isProvider ? "market_subsite_provider_list_aria" : "market_subsite_acquisition_list_aria";
  const badgeKey =
    page.listSummaryMode === "postgres_catalog"
      ? "market_subsite_masonry_catalog_badge"
      : "market_subsite_masonry_demo_badge";
  const studioLabel = isProvider
    ? t("market_subsite_open_merchant_studio")
    : t("market_subsite_open_acquisition_studio");

  return (
    <main
      className="relative min-h-screen"
      aria-label={title}
      data-testid={testId}
      data-tt-market-provider-page={isProvider ? "1" : undefined}
      data-tt-market-acquisition-page={!isProvider ? "1" : undefined}
      data-tt-subsite-country={page.effectiveCountry}
      data-tt-subsite-list-count={page.masonryItems.length}
    >
      <MarketAmbientBackdrop />
      <div className="relative z-10 isolate min-h-screen">
        <MarketHeroFrame variant="subsite">
          <h1 className={TT_MARKETING_MARKET_PAGE_H1_COMPACT}>{title}</h1>
          <p className="mt-2 text-center text-body text-slate-100/90 max-w-2xl mx-auto">{t("market_standalone_subtitle")}</p>
          <div className="mt-4 flex justify-center">
            <MarketHeroTrustPills />
          </div>
        </MarketHeroFrame>
        <div className="flex justify-center px-4 mt-3">
          <div className="w-full max-w-4xl">
            <MarketHubSubNav />
          </div>
        </div>
        {!isProvider ? <AcquisitionPublishReadinessPanel t={t} /> : null}
        {!isProvider ? <AcquisitionSubsiteStatsPanel t={t} /> : null}

        <section className="mx-auto max-w-5xl px-4 py-4" aria-labelledby="market-standalone-intro">
          <div className={`${TT_MARKETING_MARKET_DARK_PATH.subsiteHighlightPanel} text-center`}>
            <p id="market-standalone-intro" className="text-body leading-relaxed text-slate-200/95">
              {desc}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {!isProvider && identitiesBackHref ? (
                <Link
                  href={identitiesBackHref}
                  className={`${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.subsiteGhostCta} px-5 py-2.5 text-small ${travelFocusRingOffset2Classes}`}
                  data-tt-market-acquisition-back="1"
                >
                  {t("auth_register_back")}
                </Link>
              ) : null}
              {isProvider ? (
                <Link
                  href="/provider/register"
                  className={`${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.subsiteGhostCta} px-5 py-2.5 text-small ${travelFocusRingOffset2Classes}`}
                  data-tt-market-provider-onboarding="1"
                >
                  {t("market_provider_onboarding_link")}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => page.openStudio()}
                className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} px-5 py-2.5 text-small ${travelFocusRingOffset2Classes}`}
              >
                {studioLabel}
              </button>
              {!isProvider ? (
                <Link
                  href="/me/identities"
                  className={`${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.subsiteGhostCta} px-5 py-2.5 text-small ${travelFocusRingOffset2Classes}`}
                >
                  {t("market_acquisition_identities_link")}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <div className={TT_MARKETING_MARKET_DARK_PATH.marketFilterBarShell}>
          <MarketSubsiteFilterBar
            variant={variant}
            resultCount={page.masonryItems.length}
            listSummaryMode={page.listSummaryMode}
            catalogCapReached={page.catalogHasMore}
          />
        </div>

        {page.catalogDegraded && page.masonryItems.length > 0 ? (
          <div
            className="mx-auto max-w-5xl px-4 pt-2"
            role="status"
            data-tt-market-subsite-catalog-degraded="1"
          >
            <p className={`text-meta ${TT_MARKETING_MARKET_DARK_PATH.emptyStateDark} px-4 py-2 text-slate-200/95`}>
              {t("market_subsite_catalog_api_degraded_demo")}
            </p>
          </div>
        ) : null}

        {page.listError ? (
          <div className="mx-auto max-w-5xl px-4 py-4">
            <ApiErrorAlert message={page.listError} tone="dark" />
            <button
              type="button"
              onClick={() => page.refetchCatalog()}
              className={`${touchTargetLink44Classes} mt-3 ${TT_MARKETING_MARKET_DARK_PATH.subsiteGhostCta} px-4 py-2 ${travelFocusRingOffset2Classes}`}
            >
              {t("common_retry")}
            </button>
          </div>
        ) : page.listLoading ? (
          <div className="flex justify-center py-16">
            <LoadingText />
          </div>
        ) : page.masonryItems.length === 0 ? (
          <div className={`mx-auto max-w-5xl px-4 py-10 ${TT_MARKETING_MARKET_DARK_PATH.emptyStateDark}`}>
            <p className="text-body text-slate-200">{t("market_subsite_empty_filtered")}</p>
          </div>
        ) : (
          <MarketSubsiteMasonry
            listLabelKey={listLabelKey}
            items={page.masonryItems}
            onListingOpen={page.openListing}
            badgeKey={badgeKey}
          />
        )}
        {page.masonryItems.length > 0 ? <MarketSubsiteListFooterStrip variant={variant} /> : null}

        <MarketPageFooter />
      </div>

      <MarketSubsiteListingDetailDrawer
        variant={variant}
        listingId={page.listingId}
        onClose={page.closeListing}
        catalogSourced={page.drawerCatalogSourced}
      />

      {isProvider ? (
        <MerchantShowcaseStudioModal
          open={page.studioOpen}
          onClose={() => page.closeStudio()}
          onDraftSaved={() => page.refetchCatalog()}
        />
      ) : (
        <AcquisitionCarryStudioModal
          open={page.studioOpen}
          onClose={() => page.closeStudio()}
          onDraftSaved={() => page.refetchCatalog()}
        />
      )}
    </main>
  );
}
