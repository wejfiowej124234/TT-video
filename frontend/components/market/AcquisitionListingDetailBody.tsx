"use client";



import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import MarketRemoteListingImage from "@/components/market/MarketRemoteListingImage";

import MarketSubsiteListingOrderCta from "@/components/market/MarketSubsiteListingOrderCta";
import MarketSubsiteComplianceDisclosure from "@/components/market/MarketSubsiteComplianceDisclosure";

import type { DemoAcquisitionListing } from "@/lib/marketSubsiteDemo";

import { pickL10n } from "@/lib/marketSubsiteDemo";

import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

import { TT_MARKETING_BTN_MARKET_PRIMARY_PILL, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";



export function AcquisitionListingDetailBody({

  listing,

  embed,

  catalogSourced = false,

}: {

  listing: DemoAcquisitionListing;

  embed?: { onClose: () => void };

  catalogSourced?: boolean;

}) {

  const { locale, t } = useTranslation();

  const D = TT_MARKETING_MARKET_DARK_PATH;

  const title = pickL10n(listing.title, locale);

  const bountyMeta = `${listing.bountyMinUsdc}–${listing.bountyMaxUsdc} USDC`;

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

            {t("market_subsite_back_to_acquisition")}

          </button>

        </p>

      ) : null}



      <header className="space-y-3">

        <p className={`inline-flex ${D.trustEscrowBadge}`}>{t("market_subsite_acquisition_badge")}</p>

        <p className="text-body leading-relaxed text-slate-100/95">{pickL10n(listing.summary, locale)}</p>

        <div className="flex flex-wrap gap-2">

          <span className={D.subsiteTagPill}>{pickL10n(listing.route, locale)}</span>

          <span className={D.subsiteTagPill}>{pickL10n(listing.deadlineNote, locale)}</span>

          <span className={`tabular-nums ${D.trustTokenPill}`}>{bountyMeta}</span>

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

        />

      </div>



      <section className={D.subsiteHighlightPanel} aria-labelledby="acq-bounty">

        <h2 id="acq-bounty" className={D.drawerSectionAccent}>

          {t("market_subsite_acquisition_bounty_title")}

        </h2>

        <p className="mt-2 text-body tabular-nums text-slate-100/95">{bountyMeta}</p>

        <p className="mt-2 text-meta leading-relaxed text-slate-300/95">{t("market_subsite_acquisition_bounty_note")}</p>

        <h3 className="mt-4 text-small font-semibold text-white/90">{t("market_subsite_acquisition_milestones_title")}</h3>

        <ol className="mt-2 list-inside list-decimal space-y-1 text-meta text-slate-200/90">

          <li>{t("market_subsite_acquisition_milestone_1")}</li>

          <li>{t("market_subsite_acquisition_milestone_2")}</li>

          <li>{t("market_subsite_acquisition_milestone_3")}</li>

          <li>{t("market_subsite_acquisition_milestone_4")}</li>

        </ol>

      </section>



      <section className={D.subsiteHighlightPanel} aria-labelledby="acq-story">

        <h2 id="acq-story" className={D.drawerSectionAccent}>

          {t("market_subsite_detail_story")}

        </h2>

        <div className="mt-3 space-y-4 text-body leading-relaxed text-slate-200/95">

          {listing.story.map((p, i) => (

            <p key={i} className="m-0">

              {pickL10n(p, locale)}

            </p>

          ))}

        </div>

      </section>



      <section className={D.subsiteHighlightPanel} aria-labelledby="acq-standards">

        <h2 id="acq-standards" className={D.drawerSectionAccent}>

          {t("market_subsite_acquisition_standards_title")}

        </h2>

        <div className="mt-4 space-y-4">

          <div>

            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_inspection")}</h3>

            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.inspectionStandard, locale)}</p>

          </div>

          <div>

            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_authenticity")}</h3>

            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.authenticity, locale)}</p>

          </div>

          <div>

            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_condition")}</h3>

            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.condition, locale)}</p>

          </div>

          <div>

            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_rejections")}</h3>

            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.rejections, locale)}</p>

          </div>

          <div>

            <h3 className="text-small font-semibold text-white">{t("market_subsite_acquisition_handoff")}</h3>

            <p className="mt-1.5 text-body text-slate-200/95">{pickL10n(listing.handoff, locale)}</p>

          </div>

        </div>

      </section>



      <section className={D.subsiteEscrowPanel} aria-labelledby="acq-escrow">

        <h2 id="acq-escrow" className={D.drawerSectionAccent}>

          {t("market_subsite_escrow_section_title")}

        </h2>

        <p className="mt-2 text-body text-slate-200/90">{t("market_subsite_acquisition_escrow_body")}</p>

        <div className="mt-5 space-y-3">
          <MarketSubsiteListingOrderCta
            variant="acquisition"
            listingId={listing.id}
            catalogSourced={catalogSourced}
            bountyMaxUsdc={listing.bountyMaxUsdc}
          />
          <Link
            href="/disputes"
            className={`${touchTargetLink44Classes} inline-flex ${D.subsiteGhostCta} ${travelFocusRingOffset2Classes}`}
          >
            {t("market_subsite_cta_disputes")}
          </Link>
        </div>

        <MarketSubsiteComplianceDisclosure

          variant="acquisition"

          lead={<p className="m-0">{t("market_subsite_acquisition_compliance_hint")}</p>}

          extended={<p className="m-0">{t("market_subsite_acquisition_compliance_detail_extra")}</p>}

        />

      </section>

    </article>

  );

}


