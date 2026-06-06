"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_FOCUS_RING_DARK_SURFACE } from "@/lib/marketingUi";
import { CARD_SCENIC_IMAGES, UNLOCK_PRICE_USD } from "./constants";
import { getFirstDayDescription, getFirstDayImage, getDaySummary } from "./itineraryResultsUtils";
import type { DailyItemForSummary } from "./itineraryResultsUtils";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import type { OrderResponse } from "@/components/escrow/EscrowDetail/types";
import { stashEscrowOrderPrefetchFromOrderResponse } from "@/lib/orderEscrowPrefetch";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import {
  TT_MARKETING_HOME_RESULTS_CARD,
  TT_MARKETING_HOME_RESULTS_SECTION,
  TT_MARKETING_HOME_UNLOCK_BTN,
} from "@/lib/marketingUi";

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
  unlockedCardKeys: Set<string>;
  orderDetails: Record<string, unknown>;
  favoritedIds: Set<string>;
  toggleFavorite: (orderId: string) => void;
  handleUnlockClick: (orderId: string, index: number) => void;
  country: string;
  cities: string[];
  resultsSectionRef: React.RefObject<HTMLElement | null>;
}

export default function ItineraryResultsSection({
  resultOrderIds,
  unlockedCardKeys,
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
  const countNote = t("landing_results_count_note").replace("{{n}}", String(resultOrderIds.length));
  const unlockNote = t("landing_results_unlock_note").replace("{{amount}}", String(UNLOCK_PRICE_USD)).replace("{{token}}", stablecoinPair);
  return (
    <section
      id="itinerary-results"
      ref={resultsSectionRef as React.RefObject<HTMLElement> | undefined}
      className={TT_MARKETING_HOME_RESULTS_SECTION}
      data-tt-marketing-home-results="1"
    >
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h2 className="text-h4 font-semibold text-white">{t("landing_results_heading")}</h2>
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
          <ul className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:overflow-visible">
            {resultOrderIds.map((orderId, index) => {
              const cardKey = `${orderId}-${index}`;
              const unlocked = unlockedCardKeys.has(cardKey);
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
              const scenicImg = CARD_SCENIC_IMAGES[index % CARD_SCENIC_IMAGES.length];
              const title = country || cities.length > 0 ? `${t("landing_ai_itinerary")} · ${[country, cities.join(" ")].filter(Boolean).join(" ")}` : t("landing_ai_itinerary_card");
              const cardTitle = unlocked && cities.length > 0 ? `${cities.join("、")} ${t("landing_results_heading")}` : t("landing_card_blind_title");
              const daily = detail?.itinerary?.daily_itinerary;
              const desc = getFirstDayDescription(daily) || t("landing_unlocked_desc");
              const firstDayImage = getFirstDayImage(daily);
              const daySummary = getDaySummary(daily, dash, t);
              const isFav = favoritedIds.has(orderId);
              const cardImage = unlocked && firstDayImage ? firstDayImage : scenicImg;
              const cardImageSrc = communityMediaAbsoluteUrlForRender(cardImage);
              const scenicImgSrc = communityMediaAbsoluteUrlForRender(scenicImg);
              return (
                <li key={cardKey} className="min-w-[280px] max-w-[320px] md:min-w-0 md:max-w-none shrink-0 snap-start md:shrink">
                  <div className={TT_MARKETING_HOME_RESULTS_CARD}>
                    <div className="relative aspect-[4/5] min-h-[240px] overflow-hidden rounded-t-[var(--radius-lg)]">
                      {!unlocked ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- 卡片装饰图；动态 src 不宜强绑 next/image loader */}
                          <img
                            src={scenicImgSrc}
                            alt=""
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover scale-105 blur-[3px]"
                          />
                          <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center p-6 text-center">
                            <p className="text-body-l font-semibold text-white mb-1">{t("landing_card_blind_title")}</p>
                            <p className="text-meta text-white/80 mb-4">{t("landing_unlock_to_view").replace("{{amount}}", String(UNLOCK_PRICE_USD))}</p>
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
                        // eslint-disable-next-line @next/next/no-img-element -- 解锁后首图可能为外链；与盲盒卡同策略
                        <img
                          src={cardImageSrc}
                          alt={title}
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                        />
                      )}
                      <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-sm px-3 py-1.5 text-meta font-medium text-white">
                        <span aria-hidden>★</span> {t("landing_rating")}
                      </span>
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
                          className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                          aria-label={isFav ? t("empty_unfavoriteAria") : t("empty_favoriteAria")}
                        >
                          <span className={isFav ? "text-danger" : ""} aria-hidden>{isFav ? "♥" : "♡"}</span>
                        </button>
                      </form>
                    </div>
                    <div className="p-4 flex-1 flex flex-col rounded-b-[var(--radius-lg)]">
                      <h3 className="text-body-l font-bold text-white">{unlocked ? cardTitle : t("landing_card_blind_title")}</h3>
                      <p className="text-small text-white/90 mt-1.5 line-clamp-2 leading-relaxed">{unlocked ? desc : t("landing_unlocked_desc_blind")}</p>
                      {unlocked && daySummary && (
                        <p className="text-meta text-white/80 mt-1 line-clamp-1" title={daySummary}>{daySummary}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {unlocked && dayCount > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/20 px-2.5 py-1 text-meta text-white/95">
                            <span aria-hidden>🛏</span> {t("landing_days_unit").replace("{{n}}", String(dayCount))}
                          </span>
                        )}
                        {unlocked && totalBudget != null && (
                          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/20 px-2.5 py-1 text-meta text-white/95">
                            <span aria-hidden>💰</span> {t("landing_budget_label")} ${totalBudget}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/20 px-2.5 py-1 text-meta text-white/95">
                          <span aria-hidden>◇</span> {stablecoinPair}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-white/20 px-2.5 py-1 text-meta text-white/95">
                          {t("market_hero_pill_escrow")}
                        </span>
                      </div>
                      {unlocked && ab && (ab.hotel != null || ab.catering != null || ab.tickets != null || ab.guide_fee != null || ab.vehicle != null || ab.platform_fee != null) && (
                        <div className="mt-2" role="region" aria-label={t("escrow_quoteSummary")}>
                          <p className="text-meta font-medium text-white/90 mb-1">{t("escrow_quoteSummary")}</p>
                          <ul className="text-meta text-white/85 space-y-0.5" role="list">
                            {ab.hotel != null && (
                              <li>
                                {t("escrow_hotel")} {ab.hotel}
                                {t("ui_currency_suffix_usd")}
                              </li>
                            )}
                            {ab.catering != null && (
                              <li>
                                {t("escrow_catering")} {ab.catering}
                                {t("ui_currency_suffix_usd")}
                              </li>
                            )}
                            {ab.tickets != null && (
                              <li>
                                {t("escrow_tickets")} {ab.tickets}
                                {t("ui_currency_suffix_usd")}
                              </li>
                            )}
                            {ab.guide_fee != null && (
                              <li>
                                {t("escrow_guideFee")} {ab.guide_fee}
                                {t("ui_currency_suffix_usd")}
                              </li>
                            )}
                            {ab.vehicle != null && (
                              <li>
                                {t("escrow_vehicle")} {ab.vehicle}
                                {t("ui_currency_suffix_usd")}
                              </li>
                            )}
                            {ab.platform_fee != null && (
                              <li>
                                {t("escrow_platformFee")} {ab.platform_fee}
                                {t("ui_currency_suffix_usd")}
                              </li>
                            )}
                            {ab.total_budget != null && (
                              <li className="font-semibold text-white/95 pt-0.5 border-t border-white/20 mt-0.5">
                                {t("escrow_totalBudget")} {ab.total_budget}
                                {t("ui_currency_suffix_usd")}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-baseline gap-2">
                        <span className="text-meta text-white/80">{unlocked ? t("landing_total_price_label") : ""}</span>
                        <span className="text-h4 font-bold text-white">
                          {unlocked ? (totalBudget != null ? `$${totalBudget}` : dash) : `$${UNLOCK_PRICE_USD}`}
                        </span>
                        <span className="text-small text-white/80">
                          {unlocked ? t("landing_unlocked_price_usd_suffix") : t("landing_per_unlock")}
                        </span>
                      </div>
                      {unlocked && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <Link
                            href={`/escrow/${encodeURIComponent(orderId)}`}
                            onClick={stashUnlockedEscrowPayPrefetch}
                            className={`${touchTargetLink44Classes} text-small font-medium text-ref-sun/90 underline-offset-2 hover:text-ref-coral/95 hover:underline rounded-[var(--radius-sm)] ${TT_MARKETING_FOCUS_RING_DARK_SURFACE}`}
                          >
                            {t("landing_view_order_detail")}
                          </Link>
                          {showPayHub && (
                            <Link
                              href={`/pay?orderId=${encodeURIComponent(orderId)}`}
                              onClick={stashUnlockedEscrowPayPrefetch}
                              className={`${touchTargetLink44Classes} text-small font-medium text-white/90 hover:text-white underline decoration-white/40 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950`}
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
      ) : (
        <>
          <p className="text-small text-white/90 mb-3">{t("landing_placeholder_hint")}</p>
          <ul className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:overflow-visible">
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={`placeholder-${index}`} className="min-w-[280px] max-w-[320px] md:min-w-0 md:max-w-none shrink-0 snap-start md:shrink">
                <div className="relative overflow-hidden h-full flex flex-col rounded-[var(--radius-lg)] border border-white/20 border-dashed bg-black/30 backdrop-blur-sm">
                  <div className="relative aspect-[4/5] min-h-[240px] overflow-hidden rounded-t-[var(--radius-lg)] bg-black/40 flex items-center justify-center">
                    <span className="text-meta text-white/60">{t("landing_placeholder_card").replace("{{n}}", String(index + 1))}</span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col rounded-b-[var(--radius-lg)]">
                    <h3 className="text-body-l font-bold text-white/70">{t("landing_placeholder_pending")}</h3>
                    <p className="text-small text-white/50 mt-1.5 line-clamp-2">{t("landing_placeholder_after_gen")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-[var(--radius-md)] bg-white/10 px-2.5 py-1 text-meta text-white/50">—</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <span className="text-h4 font-bold text-white/50">{dash}</span>
                      <span className="text-small text-white/40 ml-1">{t("landing_placeholder_price")}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
