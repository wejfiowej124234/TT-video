import { useId } from "react";

import Link from "next/link";

import Image from "next/image";

import ApiErrorAlert from "@/components/ApiErrorAlert";

import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

import { MarketAmbientBackdrop } from "@/components/market";

import GuideOccupiedScheduleBlock, {
  type GuideTripDateSelection,
} from "@/components/guides/GuideOccupiedScheduleBlock";

import BookGuideModal from "@/components/market/BookGuideModal";

import { trackMarketEvent } from "@/lib/analytics";

import { formatGuideDisplayName } from "@/lib/guideDisplayName";

import {

  filterGuidePublicServiceTypes,

  formatGuideLanguages,

  formatGuidePublicBio,

  formatGuideServiceTypeLabel,

} from "@/lib/marketDisplayCopy";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

import {

  GUIDE_DETAIL_L5_CLOSURE_PROBE,

  GUIDE_DETAIL_L5_FROZEN_MARKER,

} from "@/lib/l5/guideDetailL5ClosureSprintModel";

import { useTranslation } from "@/components/LocaleProvider";

import {

  communityMediaAbsoluteUrlForRender,

  communityMediaNextImageUnoptimized,

} from "@/lib/communityMediaClientUrl";

import { useViewerUserId } from "@/lib/useViewerUserId";

import {

  GUIDE_DETAIL_BREADCRUMB_LINK_CLASS,

  GUIDE_DETAIL_CROSS_NAV_LINK_CLASS,

  GUIDE_DETAIL_CROSS_NAV_SEP_CLASS,

  GUIDE_DETAIL_HERO_RING_CLASS,

  GUIDE_DETAIL_INNER_DIVIDER_CLASS,

  GUIDE_DETAIL_INNER_SECTION_CLASS,

  GUIDE_DETAIL_INPUT_FOCUS_CLASS,

  GUIDE_DETAIL_PAGE_MAX_CLASS,

  GUIDE_DETAIL_PANEL_FRAME_CLASS,

  GUIDE_DETAIL_PANEL_INNER_CLASS,

  GUIDE_DETAIL_PRIMARY_BTN_CLASS,

  GUIDE_DETAIL_PRIMARY_CTA_BLOCK_CLASS,

  GUIDE_DETAIL_SECTION_LABEL_CLASS,

} from "./guideDetailPageConstants";

import { GuideIdentityStakeTrustBadge } from "@/components/guide/GuideIdentityStakeTrustBadge";

import type { GuideDetailShape } from "./guideDetailPageTypes";



const p = TT_MARKETING_MARKET_DARK_PATH;



export function GuideDetailPageLoaded({

  guide,

  stakeAmount,

  setStakeAmount,

  stakeLoading,

  stakeError,

  bookGuideOpen,

  setBookGuideOpen,

  selectedTrip,

  setSelectedTrip,

  handleStake,

  effectiveBindOrderId,

  itineraryBindActive,

  bindOrderTripLoading,

  hasBindableItineraries,

}: {

  guide: GuideDetailShape;

  stakeAmount: string;

  setStakeAmount: (v: string) => void;

  stakeLoading: boolean;

  stakeError: string | null;

  bookGuideOpen: boolean;

  setBookGuideOpen: (v: boolean) => void;

  selectedTrip: GuideTripDateSelection | null;

  setSelectedTrip: (trip: GuideTripDateSelection | null) => void;

  handleStake: () => void;

  effectiveBindOrderId: string;

  itineraryBindActive: boolean;

  bindOrderTripLoading: boolean;

  hasBindableItineraries: boolean;

}) {

  const { t } = useTranslation();

  const guideHeroNameId = useId();

  const guideTrustHeadingId = useId();

  const guideStakeAmountFieldId = useId();

  const ownUserId = useViewerUserId();

  const isOwnGuideProfile =

    Boolean(ownUserId && guide.user_id && String(ownUserId) === String(guide.user_id));



  const displayName = formatGuideDisplayName(t, guide);

  const guideHeroAvatarSrc = guide.avatar_url?.trim()

    ? communityMediaAbsoluteUrlForRender(guide.avatar_url.trim())

    : "";

  const publicBio = formatGuidePublicBio(guide.bio, 2000);

  const serviceTags = filterGuidePublicServiceTypes(guide.service_types);

  const languagesLabel = formatGuideLanguages(guide.languages, t);

  const hourlyCurrencyLabel =

    typeof guide.hourly_currency === "string" && guide.hourly_currency.trim()

      ? guide.hourly_currency.trim()

      : t("market_guide_hourly_currency_unspecified");

  const inlineLink = `${touchTargetLink44Classes} ${GUIDE_DETAIL_BREADCRUMB_LINK_CLASS}`;

  const crossNavLink = `${touchTargetLink44Classes} ${GUIDE_DETAIL_CROSS_NAV_LINK_CLASS}`;

  const hasDecisionStats =

    guide.rating != null || guide.completedCount != null || Boolean(guide.responseSLA?.trim());



  return (

    <main

      className="relative min-h-screen"

      aria-labelledby={guideHeroNameId}

      data-tt-guides-detail-page="1"

      data-tt-ui-generation="v2"

      data-tt-traveler-conversion="guide-detail"

      data-tt-market-l5="1"

      data-tt-guide-detail-l5-closure={GUIDE_DETAIL_L5_CLOSURE_PROBE}

      data-tt-ui-frozen={GUIDE_DETAIL_L5_FROZEN_MARKER}

    >

      <MarketAmbientBackdrop />



      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">

        <div className={`${GUIDE_DETAIL_PAGE_MAX_CLASS} space-y-6`}>

          <nav className="text-small text-slate-400/90" aria-label={t("guide_detail_breadcrumb_aria")}>

            <Link href="/market" className={inlineLink}>

              {t("market_hero_title")}

            </Link>

            <span className={`${GUIDE_DETAIL_CROSS_NAV_SEP_CLASS} px-1`} aria-hidden>

              /

            </span>

            <Link href="/guides" className={inlineLink}>

              {t("guides_title")}

            </Link>

            <span className={`${GUIDE_DETAIL_CROSS_NAV_SEP_CLASS} px-1`} aria-hidden>

              /

            </span>

            <span className="text-slate-200">{displayName}</span>

          </nav>



          <div className={GUIDE_DETAIL_PANEL_FRAME_CLASS}>

            <article className={`${GUIDE_DETAIL_PANEL_INNER_CLASS} overflow-hidden`}>

              <header className="p-6 sm:p-7 space-y-5" aria-labelledby={guideHeroNameId}>

                <div className="flex flex-col sm:flex-row gap-5 items-start">

                  <div

                    className={`relative w-24 h-24 shrink-0 rounded-full overflow-hidden ${GUIDE_DETAIL_HERO_RING_CLASS} bg-ref-sun/16 border border-ref-sun/32 shadow-[0_0_20px_-8px_rgba(252,164,124,0.35)]`}

                  >

                    {guideHeroAvatarSrc ? (

                      <Image

                        src={guideHeroAvatarSrc}

                        alt={t("guide_card_avatarAlt").replace("{{name}}", displayName)}

                        fill

                        priority

                        fetchPriority="high"

                        className="object-cover"

                        sizes="96px"

                        unoptimized={communityMediaNextImageUnoptimized(guideHeroAvatarSrc)}

                      />

                    ) : (

                      <span

                        className="flex h-full w-full items-center justify-center text-h3 font-bold text-ref-sun"

                        aria-hidden

                      >

                        {guide.city?.charAt(0) ?? t("market_guideAvatarFallback")}

                      </span>

                    )}

                  </div>

                  <div className="min-w-0 flex-1 space-y-3">

                    <div>

                      <h1 id={guideHeroNameId} className="text-h3 font-semibold text-white tracking-tight">

                        {displayName}

                      </h1>

                      <p className="text-small text-slate-300 mt-0.5">

                        {guide.city ?? t("ui_em_dash")} · {guide.country_code ?? t("ui_em_dash")}

                      </p>

                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                      <span className={p.trustDidVerified} title={t("guide_card_didVerified")}>

                        <span aria-hidden className="text-ref-sun/85">

                          ✓

                        </span>{" "}

                        {t("guide_detail_didVerified")}

                      </span>

                      {guide.stake_amount?.trim() ? (
                        <GuideIdentityStakeTrustBadge stakeAmount={guide.stake_amount.trim()} />
                      ) : null}

                    </div>

                    {guide.hourly_rate != null && guide.hourly_rate !== "" ? (

                      <p className="text-body font-semibold text-ref-sun tabular-nums [color:var(--ref-sun)]">

                        {t("guide_detail_perHour")

                          .replace("{{amount}}", String(guide.hourly_rate))

                          .replace("{{currency}}", hourlyCurrencyLabel)}

                      </p>

                    ) : (

                      <p className={p.cardHourlyOnRequest}>{t("market_guide_hourly_on_request")}</p>

                    )}

                  </div>

                </div>



                <div

                  className="rounded-[var(--radius-sm)] border border-ref-sun/14 bg-ink-900/35 px-4 py-3 space-y-3"

                  aria-label={t("guide_detail_hero_signals_aria")}

                  data-tt-guide-detail-decision="1"

                >

                  {hasDecisionStats ? (

                    <div className={`flex flex-wrap gap-x-4 gap-y-1 ${p.drawerHintText}`}>

                      {guide.rating != null ? (

                        <span>{t("guide_card_rating").replace("{{n}}", String(guide.rating))}</span>

                      ) : null}

                      {guide.completedCount != null ? (

                        <span>{t("guide_card_completed").replace("{{n}}", String(guide.completedCount))}</span>

                      ) : null}

                      {guide.responseSLA ? (

                        <span>{t("guide_card_response").replace("{{n}}", guide.responseSLA)}</span>

                      ) : null}

                    </div>

                  ) : null}

                  <div>

                    <p className={GUIDE_DETAIL_SECTION_LABEL_CLASS}>{t("guide_card_lang").replace("：", "")}</p>

                    <p className="text-small text-slate-200 mt-0.5">{languagesLabel}</p>

                  </div>

                  {serviceTags.length > 0 ? (

                    <div>

                      <p className={GUIDE_DETAIL_SECTION_LABEL_CLASS}>{t("guide_detail_specialty")}</p>

                      <div className="flex flex-wrap gap-1.5 mt-0.5">

                        {serviceTags.map((tag) => (

                          <span key={tag} className={p.cardTagChip}>

                            {formatGuideServiceTypeLabel(tag, t)}

                          </span>

                        ))}

                      </div>

                    </div>

                  ) : null}

                </div>

              </header>



              {guide.id ? (

                <div className={`${GUIDE_DETAIL_INNER_DIVIDER_CLASS} bg-ink-900/40 px-6 py-4 space-y-2`}>

                  <p className="text-small text-[#e8ddd4]/90 font-medium" role="status">

                    {selectedTrip

                      ? t("guide_detail_conversion_trip_ready").replace(

                          "{{range}}",

                          `${selectedTrip.start} – ${selectedTrip.end}`,

                        )

                      : itineraryBindActive

                        ? t("guide_detail_conversion_next")

                        : hasBindableItineraries

                          ? t("guide_detail_conversion_has_itineraries")

                          : t("guide_detail_conversion_book_cta")}

                  </p>

                  {itineraryBindActive && !selectedTrip && bindOrderTripLoading ? (

                    <p className="text-meta text-slate-400">{t("guide_detail_trip_from_itinerary_loading")}</p>

                  ) : !itineraryBindActive && !hasBindableItineraries ? (

                    <p className="text-meta text-slate-400">{t("guide_detail_book_no_itinerary_hint")}</p>

                  ) : null}

                  <button

                    type="button"

                    data-tt-guide-detail-book-cta="1"

                    disabled={itineraryBindActive && bindOrderTripLoading}

                    onClick={() => {

                      trackMarketEvent("market_guide_detail_book_click", { guideId: guide.id });

                      setBookGuideOpen(true);

                    }}

                    className={`${GUIDE_DETAIL_PRIMARY_CTA_BLOCK_CLASS} disabled:cursor-not-allowed disabled:opacity-45`}

                  >

                    {t("guide_card_book")}

                  </button>

                </div>

              ) : null}



              <div className={`${GUIDE_DETAIL_INNER_DIVIDER_CLASS} ${GUIDE_DETAIL_INNER_SECTION_CLASS}`}>

                <h2 className={GUIDE_DETAIL_SECTION_LABEL_CLASS}>{t("guide_detail_bio")}</h2>

                <p className="text-small text-slate-200 whitespace-pre-wrap leading-relaxed mt-1">

                  {publicBio ?? t("guide_detail_bioEmpty")}

                </p>

              </div>



              <footer

                className={`${GUIDE_DETAIL_INNER_DIVIDER_CLASS} ${GUIDE_DETAIL_INNER_SECTION_CLASS} bg-black/20`}

                aria-labelledby={guideTrustHeadingId}

              >

                <h2 id={guideTrustHeadingId} className={GUIDE_DETAIL_SECTION_LABEL_CLASS}>

                  {t("guide_detail_consumer_trust_title")}

                </h2>

                <p className="text-small text-slate-300/95 leading-relaxed mt-1">

                  {t("guide_detail_consumer_trust_body")}

                </p>

              </footer>

            </article>

          </div>



          {guide.id ? (
            <GuideOccupiedScheduleBlock
              guideId={guide.id}
              selectable={!itineraryBindActive && !hasBindableItineraries}
              selectedTrip={selectedTrip}
              onTripSelect={
                itineraryBindActive || hasBindableItineraries ? undefined : setSelectedTrip
              }
            />
          ) : null}



          {isOwnGuideProfile ? (

            <div className={GUIDE_DETAIL_PANEL_FRAME_CLASS}>

              <section className={`${GUIDE_DETAIL_PANEL_INNER_CLASS} p-6`}>

                <h3 className="text-small font-semibold text-ref-sun/90 mb-2">{t("guideDetail_stakeSection")}</h3>

                <form

                  className="flex gap-2 items-center flex-wrap"

                  onSubmit={(e) => {

                    e.preventDefault();

                    handleStake();

                  }}

                >

                  <label htmlFor={guideStakeAmountFieldId} className="sr-only">

                    {t("guideDetail_stakeAmountLabel")}

                  </label>

                  <input

                    id={guideStakeAmountFieldId}

                    type="text"

                    value={stakeAmount}

                    onChange={(e) => setStakeAmount(e.target.value)}

                    placeholder={t("guideDetail_amountPlaceholder")}

                    className={`min-h-[44px] rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-700/80 px-3 py-2 text-small text-slate-200 placeholder:text-slate-400 w-28 ${GUIDE_DETAIL_INPUT_FOCUS_CLASS}`}

                    autoComplete="off"

                    aria-label={t("guideDetail_amountPlaceholder")}

                  />

                  <button

                    type="submit"

                    disabled={stakeLoading || !stakeAmount.trim()}

                    aria-busy={stakeLoading ? true : undefined}

                    className={GUIDE_DETAIL_PRIMARY_BTN_CLASS}

                  >

                    {stakeLoading ? t("guideDetail_submitting") : t("guideDetail_stake")}

                  </button>

                </form>

                {stakeError ? (

                  <div className="mt-2">

                    <ApiErrorAlert message={stakeError} tone="dark" />

                  </div>

                ) : null}

              </section>

            </div>

          ) : null}



          <ProductCrossNav

            ariaLabelKey="guide_detail_relatedNav_aria"

            showGuides

            className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400/90 pt-6 border-t border-ref-sun/12"

            linkClassName={crossNavLink}

            separatorClassName={GUIDE_DETAIL_CROSS_NAV_SEP_CLASS}

          />



          {guide.id && bookGuideOpen ? (

            <BookGuideModal

              guideId={guide.id}

              guideName={displayName}

              bindOrderId={effectiveBindOrderId || undefined}

              tripStart={selectedTrip?.start}

              tripEnd={selectedTrip?.end}

              requireTripDates={false}

              onClose={() => setBookGuideOpen(false)}

            />

          ) : null}

        </div>

      </div>

    </main>

  );

}


