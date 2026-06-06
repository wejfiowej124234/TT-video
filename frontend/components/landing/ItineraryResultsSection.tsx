"use client";

import { memo, useMemo } from "react";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import { touchTargetLink44Classes, travelFocusRingCoreClasses } from "@/lib/travelLinkFocus";

import { landingAmbientImageUrl } from "@/lib/landingAmbientByCountry";

import {

  TT_MARKETING_HOME_PREVIEW_SLOT_CARD,

  TT_MARKETING_HOME_PREVIEW_SLOT_FOOTER,

  TT_MARKETING_HOME_RESULTS_CARD,

  TT_MARKETING_HOME_RESULTS_HEADING,

  TT_MARKETING_HOME_RESULTS_LEAD,

  TT_MARKETING_HOME_RESULTS_PANEL,

  TT_MARKETING_HOME_RESULTS_SECTION,

  TT_MARKETING_HOME_UNLOCK_BTN,

} from "@/lib/marketingUi";

import { CARD_SCENIC_IMAGES, ITINERARY_CARD_COUNT } from "./constants";

import { getFirstDayDescription, getFirstDayImage, getDaySummary } from "./itineraryResultsUtils";

import type { DailyItemForSummary } from "./itineraryResultsUtils";

import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";

import type { OrderResponse } from "@/components/escrow/EscrowDetail/types";

import { stashEscrowOrderPrefetchFromOrderResponse } from "@/lib/orderEscrowPrefetch";



/** 52 §3.2 金额分项（与 API 响应一致） */

type AmountBreakdown52 = {

  hotel?: number;

  catering?: number;

  tickets?: number;

  guide_fee?: number;

  vehicle?: number;

  platform_fee?: number;

  total_budget?: number;

};



/** 52 统一表兼容：daily_itinerary 项（56-S4 按天·配图） */

type OrderDetail = {

  itinerary?: {

    daily_itinerary?: DailyItemForSummary[];

    amount_breakdown?: AmountBreakdown52;

  };

  amount_breakdown?: AmountBreakdown52;

};



export interface ItineraryResultsSectionProps {

  resultOrderIds: string[];

  /** 生成中且尚无结果：展示 skeleton 预览卡 */

  submitting: boolean;

  unlockedOrderIds: Set<string>;

  orderDetails: Record<string, unknown>;

  favoritedIds: Set<string>;

  toggleFavorite: (orderId: string) => void;

  handleUnlockClick: (orderId: string, index: number) => void;

  country: string;

  cities: string[];

  resultsSectionRef: React.RefObject<HTMLElement | null>;

}



function ItineraryResultsSection({

  resultOrderIds,

  submitting,

  unlockedOrderIds,

  orderDetails,

  favoritedIds,

  toggleFavorite,

  handleUnlockClick,

  country,

  cities,

  resultsSectionRef,

}: ItineraryResultsSectionProps) {

  const { t } = useTranslation();

  const dash = t("ui_em_dash");

  const stablecoinPair = t("didRank_badge_stablecoins");

  const countNote = t("landing_results_count_note");

  const unlockNote = t("landing_results_unlock_note");

  const showGenerating = submitting && resultOrderIds.length === 0;

  const destinationCover = useMemo(
    () => (country ? landingAmbientImageUrl(country) : CARD_SCENIC_IMAGES[0]!),
    [country],
  );



  const renderPreviewSlotCards = (mode: "empty" | "generating") => (

    <ul

      className="mx-auto max-w-md"

      {...(mode === "generating" ? { "data-tt-home-results-generating": "1" } : {})}

    >

      {Array.from({ length: ITINERARY_CARD_COUNT }).map((_, index) => (

        <li key={`${mode}-${index}`}>

          <div

            className={`${TT_MARKETING_HOME_PREVIEW_SLOT_CARD} ${mode === "generating" ? "animate-pulse" : ""}`}

          >

            <div className="relative aspect-[4/5] min-h-[240px] overflow-hidden rounded-t-[var(--radius-lg)] ring-1 ring-inset ring-white/10">

              <img

                src={destinationCover}

                alt=""

                decoding="async"

                loading="lazy"

                fetchPriority="low"

                className="absolute inset-0 h-full w-full object-cover opacity-35 saturate-[0.85]"

                draggable={false}

              />

              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/55 to-ink-950/40" aria-hidden />

              <div className="absolute inset-0 flex items-center justify-center p-3">

                <span className="inline-flex rounded-full border border-white/25 bg-black/60 px-3 py-1.5 text-meta font-semibold text-white ring-1 ring-ref-sun/40 backdrop-blur-sm">

                  {t("landing_ai_itinerary")}

                </span>

              </div>

            </div>

            <div className="p-4 flex-1 flex flex-col rounded-b-[var(--radius-lg)] bg-ink-950/40">

              <h3 className="text-body-l font-bold text-white">

                {mode === "generating" ? t("landing_generating_card") : t("landing_placeholder_pending")}

              </h3>

              <p className="text-small text-white/80 mt-1.5 line-clamp-3 leading-relaxed">

                {mode === "generating" ? t("landing_generating_hint") : t("landing_placeholder_after_gen")}

              </p>

              <div className="mt-auto pt-4 border-t border-white/15">

                <span

                  className={TT_MARKETING_HOME_PREVIEW_SLOT_FOOTER}

                  aria-disabled="true"

                  role="status"

                >

                  {t("landing_placeholder_price")}

                </span>

              </div>

            </div>

          </div>

        </li>

      ))}

    </ul>

  );

  return (

    <section

      id="itinerary-results"

      ref={resultsSectionRef as React.RefObject<HTMLElement> | undefined}

      data-tt-home-itinerary-honesty="phase1-mock-ai-not-production"

      className={`${TT_MARKETING_HOME_RESULTS_SECTION} ${TT_MARKETING_HOME_RESULTS_PANEL} [content-visibility:auto]`}

    >

      <p className={TT_MARKETING_HOME_RESULTS_LEAD}>{t("landing_results_section_lead")}</p>

      <div className="flex flex-wrap items-center gap-3 mb-2">

        <h2 className={TT_MARKETING_HOME_RESULTS_HEADING}>{t("landing_results_heading")}</h2>

        {resultOrderIds.length > 0 && (country || cities.length > 0) && (

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 backdrop-blur-sm px-3 py-1.5 text-small text-white/95">

            <span aria-hidden>📍</span> {[country, cities.join("、")].filter(Boolean).join(" · ")}

          </span>

        )}

      </div>

      {resultOrderIds.length > 0 ? (

        <>

          <p className="text-small text-white/90 mb-3">{countNote}</p>

          <p className="text-small text-white/80 mb-6">{unlockNote}</p>

          <ul className="mx-auto max-w-md">

            {resultOrderIds.map((orderId, index) => {

              const unlocked = unlockedOrderIds.has(orderId);

              const detail = orderDetails[orderId] as OrderDetail | undefined;

              const apiRes = orderDetails[orderId] as OrderResponse | undefined;

              const stashUnlockedEscrowPayPrefetch = () =>

                stashEscrowOrderPrefetchFromOrderResponse(orderId, apiRes);

              const orderRow = apiRes?.order ?? null;

              const showPayHub = unlocked && orderLikeMayOnchainDeposit(orderRow);

              const dayCount = detail?.itinerary?.daily_itinerary?.length ?? 0;

              const ab = detail?.itinerary && typeof detail.itinerary === "object" && "amount_breakdown" in detail.itinerary

                ? (detail.itinerary as { amount_breakdown: AmountBreakdown52 }).amount_breakdown

                : undefined;

              const totalBudget = ab?.total_budget;

              const title = country || cities.length > 0 ? `${t("landing_ai_itinerary")} · ${[country, cities.join(" ")].filter(Boolean).join(" ")}` : t("landing_ai_itinerary_card");

              const cardTitle = unlocked && cities.length > 0

                ? `${cities.join("、")} ${t("landing_results_heading")}`

                : title;

              const daily = detail?.itinerary?.daily_itinerary;

              const desc = getFirstDayDescription(daily) || t("landing_unlocked_desc");

              const firstDayImage = getFirstDayImage(daily);

              const daySummary = getDaySummary(daily, dash, t);

              const isFav = favoritedIds.has(orderId);

              const lockedCover = destinationCover;

              const cardImage = unlocked && firstDayImage ? firstDayImage : lockedCover;

              return (

                <li key={orderId}>

                  <div className={TT_MARKETING_HOME_RESULTS_CARD}>

                    <div className="relative aspect-[4/5] min-h-[240px] overflow-hidden rounded-t-[var(--radius-lg)]">

                      {!unlocked ? (

                        <>

                          <img

                            src={lockedCover}

                            alt=""

                            decoding="async"

                            loading="lazy"

                            fetchPriority="low"

                            className="absolute inset-0 h-full w-full object-cover scale-105 blur-[3px]"

                          />

                          <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center p-6 text-center">

                            <p className="text-body-l font-semibold text-white mb-1">{title}</p>

                            <p className="text-meta text-white/80 mb-4">{t("landing_unlock_to_view")}</p>

                            <form

                              className="inline"

                              onSubmit={(e) => {

                                e.preventDefault();

                                handleUnlockClick(orderId, index);

                              }}

                            >

                              <button

                                type="submit"

                                className={TT_MARKETING_HOME_UNLOCK_BTN}

                              >

                                {t("landing_btn_unlock")}

                              </button>

                            </form>

                          </div>

                        </>

                      ) : (

                        <img

                          src={cardImage}

                          alt={title}

                          decoding="async"

                          loading="lazy"

                          fetchPriority="low"

                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"

                        />

                      )}

                      {unlocked ? (

                        <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-sm px-3 py-1.5 text-meta font-medium text-white">

                          {t("landing_trust_preview")}

                        </span>

                      ) : null}

                      <form

                        className="absolute right-3 top-3 z-20"

                        onSubmit={(e) => {

                          e.preventDefault();

                          e.stopPropagation();

                          toggleFavorite(orderId);

                        }}

                      >

                        <button

                          type="submit"

                          className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"

                          aria-label={isFav ? t("empty_unfavoriteAria") : t("empty_favoriteAria")}

                        >

                          <span className={isFav ? "text-danger" : ""} aria-hidden>{isFav ? "♥" : "♡"}</span>

                        </button>

                      </form>

                    </div>

                    <div className="p-4 flex-1 flex flex-col rounded-b-[var(--radius-lg)]">

                      <h3 className="text-body-l font-bold text-white">{unlocked ? cardTitle : title}</h3>

                      <p className="text-small text-white/90 mt-1.5 line-clamp-2 leading-relaxed">{unlocked ? desc : t("landing_unlocked_desc_blind")}</p>

                      {unlocked && daySummary && (

                        <p className="text-meta text-white/80 mt-1 line-clamp-1" title={daySummary}>{daySummary}</p>

                      )}

                      {unlocked && (

                        <div className="mt-3 flex flex-wrap gap-2">

                          {dayCount > 0 && (

                            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/20 px-2.5 py-1 text-meta text-white/95">

                              <span aria-hidden>🛏</span> {t("landing_days_unit").replace("{{n}}", String(dayCount))}

                            </span>

                          )}

                          {totalBudget != null && (

                            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/20 px-2.5 py-1 text-meta text-white/95">

                              <span aria-hidden>💰</span> {t("landing_quote_mid_label")} {totalBudget} {stablecoinPair}

                            </span>

                          )}

                          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/20 px-2.5 py-1 text-meta text-white/95">

                            <span aria-hidden>◇</span> {stablecoinPair}

                          </span>

                          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/20 px-2.5 py-1 text-meta text-white/95">

                            {t("market_hero_pill_escrow")}

                          </span>

                        </div>

                      )}

                      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-baseline gap-2">

                        {unlocked ? (

                          <>

                            <span className="text-meta text-white/80">{t("landing_total_price_label")}</span>

                            <span className="text-h4 font-bold text-white">

                              {totalBudget != null ? `${totalBudget} ${stablecoinPair}` : dash}

                            </span>

                          </>

                        ) : (

                          <span className="text-small font-medium text-white/80">{t("landing_per_unlock")}</span>

                        )}

                      </div>

                      {unlocked && (

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">

                          <Link

                            href={`/escrow/${encodeURIComponent(orderId)}`}

                            onClick={stashUnlockedEscrowPayPrefetch}

                            className={`${touchTargetLink44Classes} text-small font-medium text-travel-300 hover:underline rounded-[var(--radius-sm)] ${travelFocusRingCoreClasses} focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}

                          >

                            {t("landing_view_order_detail")}

                          </Link>

                          {showPayHub && (

                            <Link

                              href={`/pay?orderId=${encodeURIComponent(orderId)}`}

                              onClick={stashUnlockedEscrowPayPrefetch}

                              className={`${touchTargetLink44Classes} text-small font-medium text-white/90 hover:text-white underline decoration-white/40 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}

                            >

                              {t("orders_payHub")}

                            </Link>

                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </li>

              );

            })}

          </ul>

        </>

      ) : showGenerating ? (

        <>

          <p className="text-small text-white/90 mb-3">{t("landing_generating_hint")}</p>

          {renderPreviewSlotCards("generating")}

        </>

      ) : (

        <>

          <p className="text-small text-white/90 mb-3">{t("landing_placeholder_hint")}</p>

          {renderPreviewSlotCards("empty")}

        </>

      )}

    </section>

  );

}

export default memo(ItineraryResultsSection);

