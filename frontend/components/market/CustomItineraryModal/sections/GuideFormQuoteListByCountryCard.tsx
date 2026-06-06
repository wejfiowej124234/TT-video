"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import type { GuideQuoteBreakdown } from "../useQuoteCalculation";
import { marketStudioModalSectionHeadingLight } from "../../marketStudioModalLayout";

export function GuideFormQuoteListByCountryCard({
  headcountLabelN,
  guideQuoteBreakdown,
  hasGuideInterCity,
  t,
}: {
  headcountLabelN: number;
  guideQuoteBreakdown: GuideQuoteBreakdown;
  hasGuideInterCity: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className={CIM.customItineraryPanelLg}>
      <h3 className={`${marketStudioModalSectionHeadingLight} drop-shadow-market-pill`}>
        {t("market_quoteListTitle")}
      </h3>
      <p className="text-meta text-white/70">
        {t("market_guideQuoteByHeadcount").replace("{{n}}", String(headcountLabelN))}
      </p>
      <ul className="text-meta text-white/90 space-y-1">
        {guideQuoteBreakdown.attractionTotal > 0 && (
          <li>
            {t("market_budgetBreakdownAttractions")}：{guideQuoteBreakdown.attractionTotal}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
        {guideQuoteBreakdown.foodTotal > 0 && (
          <li>
            {t("market_budgetBreakdownFood")}：{guideQuoteBreakdown.foodTotal}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
        {guideQuoteBreakdown.hotelTotal > 0 && (
          <li>
            {t("market_budgetBreakdownHotel")}：{guideQuoteBreakdown.hotelTotal}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
        {guideQuoteBreakdown.guideTotal > 0 && (
          <li>
            {t("market_budgetBreakdownGuide")}：{guideQuoteBreakdown.guideTotal}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
        {guideQuoteBreakdown.cityTransportFee > 0 && (
          <li>
            {t("market_cityTransportFee")}：{guideQuoteBreakdown.cityTransportFee}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
        {hasGuideInterCity && guideQuoteBreakdown.interCityFee > 0 && (
          <li>
            {t("market_interCityTransportFee")}：{guideQuoteBreakdown.interCityFee}
            {t("ui_currency_suffix_usdc")}
          </li>
        )}
      </ul>
      <p className="text-small font-semibold text-white pt-2 border-t border-ref-sun/14">
        {t("market_quoteTotal")}：{guideQuoteBreakdown.total}
        {t("ui_currency_suffix_usdc")}
      </p>
      <p className="text-meta text-white/80">
        {t("market_budgetPerDayEst")} {t("market_budgetPerDayValue").replace("{{amount}}", String(guideQuoteBreakdown.perDay))}
      </p>
    </div>
  );
}
