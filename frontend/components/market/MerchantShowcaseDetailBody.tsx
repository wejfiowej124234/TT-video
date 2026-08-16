"use client";



import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import MarketRemoteListingImage from "@/components/market/MarketRemoteListingImage";

import MarketSubsiteListingOrderCta from "@/components/market/MarketSubsiteListingOrderCta";
import MarketSubsiteComplianceDisclosure from "@/components/market/MarketSubsiteComplianceDisclosure";

import type { DemoMerchantListing } from "@/lib/marketSubsiteDemo";

import { pickL10n } from "@/lib/marketSubsiteDemo";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";

import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

import { TT_MARKETING_BTN_MARKET_PRIMARY_PILL, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";



export function MerchantShowcaseDetailBody({

  listing,

  embed,

  catalogSourced = false,

}: {

  listing: DemoMerchantListing;

  /** 抽屉内：顶部「返回」关闭侧栏，不整页跳转 */

  embed?: { onClose: () => void };

  /** PG catalog 条目：启用 **`POST …/orders`** 主 CTA */

  catalogSourced?: boolean;

}) {

  const { locale, t } = useTranslation();

  const D = TT_MARKETING_MARKET_DARK_PATH;

  const title = pickL10n(listing.title, locale);

  const subtitle = pickL10n(listing.subtitle, locale);

  const articleClass = embed

    ? "mx-0 max-w-none space-y-5 px-0 pb-6 pt-0"

    : "mx-auto max-w-3xl space-y-6 px-4 pb-12 pt-2 sm:px-6";



  return (

    <article className={articleClass}>

      {embed ? (

        <p className="m-0">

          <button

            type="button"

            onClick={embed.onClose}

            className={`${touchTargetLink44Classes} ${D.inlineLinkUnderline} ${travelFocusRingOffset2Classes}`}

          >

            {t("market_subsite_back_to_provider")}

          </button>

        </p>

      ) : null}



      <header className="space-y-3">

        <p className="text-body text-slate-100/95">
          <UgcTranslatedText
            as="span"
            policy="cache_first"
            contentClass="merchant_listing"
            contentId={listing.id}
            field="subtitle"
            originalText={subtitle}
          />
        </p>

        <div className="flex flex-wrap gap-2">

          <span className={D.subsiteTagPill}>{pickL10n(listing.city, locale)}</span>

          <span className={D.subsiteTagPill}>{pickL10n(listing.category, locale)}</span>

          <span className={`tabular-nums ${D.trustTokenPill}`}>{listing.priceUsdc} USDC</span>

        </div>

      </header>



      <div className={D.subsiteHeroMedia}>

        <MarketRemoteListingImage

          src={listing.imageSrc}

          alt={title}

          fill

          className="object-cover"

          sizes="(max-width: 768px) 100vw, 28rem"

          priority={!embed}

          fallbackSeed={listing.id}

        />

      </div>



      <section className={D.subsiteHighlightPanel} aria-labelledby="merchant-highlights">

        <h2 id="merchant-highlights" className={D.drawerSectionAccent}>

          {t("market_subsite_detail_highlights")}

        </h2>

        <ul className="mt-3 list-inside list-disc space-y-1.5 text-body text-slate-200/95">

          {listing.highlights.map((h, i) => (

            <li key={i}>{pickL10n(h, locale)}</li>

          ))}

        </ul>

      </section>



      <section className={D.subsiteHighlightPanel} aria-labelledby="merchant-story">

        <h2 id="merchant-story" className={D.drawerSectionAccent}>

          {t("market_subsite_detail_story")}

        </h2>

        <div className="mt-3 space-y-4 text-body leading-relaxed text-slate-200/95">

          {listing.story.map((p, i) => (
            <p key={i} className="m-0">
              {i === 0 ? (
                <UgcTranslatedText
                  as="span"
                  policy="cache_first"
                  contentClass="merchant_listing"
                  contentId={listing.id}
                  field="description"
                  originalText={pickL10n(p, locale)}
                />
              ) : (
                pickL10n(p, locale)
              )}
            </p>
          ))}

        </div>

      </section>



      <section className={D.subsiteEscrowPanel} aria-labelledby="merchant-escrow">

        <h2 id="merchant-escrow" className={D.drawerSectionAccent}>

          {t("market_subsite_escrow_section_title")}

        </h2>

        <p className="mt-2 text-body text-slate-200/90">{t("market_subsite_escrow_section_body")}</p>

        <div className="mt-5 space-y-3">
          <MarketSubsiteListingOrderCta
            variant="provider"
            listingId={listing.id}
            catalogSourced={catalogSourced}
          />
          <Link
            href="/disputes"
            className={`${touchTargetLink44Classes} inline-flex ${D.subsiteGhostCta} ${travelFocusRingOffset2Classes}`}
          >
            {t("market_subsite_cta_disputes")}
          </Link>
        </div>

        <MarketSubsiteComplianceDisclosure

          variant="merchant"

          lead={<p className="m-0">{t("market_subsite_merchant_compliance_lead")}</p>}

          extended={<p className="m-0">{t("market_subsite_merchant_compliance_detail_extra")}</p>}

        />

      </section>

    </article>

  );

}


