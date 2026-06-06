"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import MarketSubsitePageChrome from "@/components/market/MarketSubsitePageChrome";
import { AcquisitionListingDetailBody } from "@/components/market/AcquisitionListingDetailBody";
import type { DemoAcquisitionListing } from "@/lib/marketSubsiteDemo";
import { pickL10n } from "@/lib/marketSubsiteDemo";
import type { MarketListingDetailProvenance } from "@/lib/marketSubsiteDetailPageModel";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import { trackMarketEvent } from "@/lib/analytics";

export function AcquisitionListingDetailView({
  listing,
  provenance = "postgres_catalog",
}: {
  listing: DemoAcquisitionListing;
  provenance?: MarketListingDetailProvenance;
}) {
  const { locale, t } = useTranslation();
  const title = pickL10n(listing.title, locale);

  useEffect(() => {
    trackMarketEvent("market_subsite_detail_view", { variant: "acquisition", listingId: listing.id });
  }, [listing.id]);

  return (
    <MarketSubsitePageChrome
      mainLabel={title}
      data-testid="market-acquisition-detail"
      subsiteDetailAudit={{ variant: "acquisition", phase: provenance }}
      showHeroTrustStrip={false}
      heroTitle={title}
      heroSubtitle={
        <div className="mx-auto max-w-3xl space-y-3">
          <p className="m-0 text-center text-meta leading-relaxed text-slate-300/95">{t("market_subsite_hero_data_source_note")}</p>
          <p className="m-0 text-center">
            <Link
              href="/market/acquisition"
              className={`${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.inlineLinkUnderline} ${travelFocusRingOffset2Classes}`}
            >
              {t("market_subsite_back_to_acquisition")}
            </Link>
          </p>
        </div>
      }
    >
      {provenance === "demo_studio" ? (
        <div
          className="mb-4 rounded-[var(--radius-md)] border border-warning/40 bg-warning/30 px-3 py-2 text-meta text-white/95"
          role="status"
          data-tt-market-subsite-detail-surface="demo_provenance_banner"
        >
          {t("market_subsite_detail_demo_provenance_note")}
        </div>
      ) : null}
      <AcquisitionListingDetailBody listing={listing} catalogSourced={provenance === "postgres_catalog"} />
    </MarketSubsitePageChrome>
  );
}
