"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import type { BudgetBreakdown } from "../useQuoteCalculation";

export interface TouristQuoteSummaryBlockProps {
  budgetBreakdown: BudgetBreakdown;
  suggestedCityTransportFee: number;
  suggestedInterCityFee: number;
  t: (key: string) => string;
}

export default function TouristQuoteSummaryBlock({
  budgetBreakdown,
  suggestedCityTransportFee,
  suggestedInterCityFee,
  t,
}: TouristQuoteSummaryBlockProps) {
  return (
    <div className={CIM.customItineraryPanelQuote}>
      <h3 className="text-small font-semibold text-white drop-shadow-market-pill">
        {t("market_quoteListTitle")}
      </h3>
      <p className="text-meta text-white/70">
        {t("market_guideQuoteByHeadcount").replace("{{n}}", String(budgetBreakdown.headcount))}
      </p>
      <ul className="text-meta text-white/90 space-y-1">
        {budgetBreakdown.attractionCount > 0 && (
          <li>
            {t("market_budgetBreakdownAttractions")}：{budgetBreakdown.attractionsTotal}
            {t("ui_currency_suffix_usdc")}（
            {t("market_budgetBreakdownItems").replace("{{count}}", String(budgetBreakdown.attractionCount))}）
          </li>
        )}
        {budgetBreakdown.foodCount > 0 && (
          <li>
            {t("market_budgetBreakdownFood")}：{budgetBreakdown.foodTotal}
            {t("ui_currency_suffix_usdc")}（
            {t("market_budgetBreakdownItems").replace("{{count}}", String(budgetBreakdown.foodCount))}）
          </li>
        )}
        {budgetBreakdown.hotelNights > 0 && (
          <li>
            {t("market_budgetBreakdownHotel")}：{budgetBreakdown.hotelTotal}
            {t("ui_currency_suffix_usdc")}（
            {t("market_budgetBreakdownNights").replace("{{n}}", String(budgetBreakdown.hotelNights))}）
          </li>
        )}
        {suggestedCityTransportFee > 0 && (
          <li>
            {t("market_cityTransportFee")}：{suggestedCityTransportFee}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
        {suggestedInterCityFee > 0 && (
          <li>
            {t("market_interCityTransportFee")}：{suggestedInterCityFee}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
        {budgetBreakdown.guideTotal > 0 && (
          <li>
            {t("market_budgetBreakdownGuide")}：{budgetBreakdown.guideTotal}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
      </ul>
      <p className="text-small font-semibold text-white pt-2 border-t border-ref-sun/14">
        {t("market_quoteTotal")}：{budgetBreakdown.total}
        {t("ui_currency_suffix_usdc")}
      </p>
      <p className="text-meta text-white/80">
        {t("market_budgetPerDayEst")} {t("market_budgetPerDayValue").replace("{{amount}}", String(budgetBreakdown.perDay))}
      </p>
    </div>
  );
}
