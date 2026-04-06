"use client";

import type { CustomItineraryForm, GuideLevelOptionWithPricing } from "../types";
import type { BudgetBreakdown, TransportLine, InterCityLine } from "../useQuoteCalculation";
import { TRANSPORT_OPTIONS, CITY_TRANSPORT_OPTIONS } from "../constants";
import type { Dispatch, SetStateAction } from "react";

export interface TouristGuideAndTransportSectionProps {
  guideLevelsWithPricing: GuideLevelOptionWithPricing[];
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  budgetBreakdown: BudgetBreakdown;
  touristCityTransportLines: TransportLine[];
  hasTouristInterCity: boolean;
  touristInterCityTransportLines: InterCityLine[];
  suggestedTransportFee: number;
  labelClass: string;
  t: (key: string) => string;
}

export default function TouristGuideAndTransportSection({
  guideLevelsWithPricing,
  form,
  setForm,
  budgetBreakdown,
  touristCityTransportLines,
  hasTouristInterCity,
  touristInterCityTransportLines,
  suggestedTransportFee,
  labelClass,
  t,
}: TouristGuideAndTransportSectionProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/25 bg-white/5 p-4 space-y-4">
      <h3 className="text-small font-semibold text-white drop-shadow-market-pill">
        {t("market_web3Guide")}
      </h3>
      <div>
        <span className={labelClass}>{t("market_guideOption")}</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {guideLevelsWithPricing.map((level) => (
            <label key={level.value} className="flex min-h-[44px] items-center justify-start gap-2 cursor-pointer text-small text-white">
              <input
                type="radio"
                name="needGuide"
                checked={form.needGuide === level.value}
                onChange={() =>
                  setForm((f) => ({
                    ...f,
                    needGuide: level.value,
                    guideFee: String(level.suggestedPerDay * f.totalDays),
                  }))
                }
                className="rounded-full border-white/25 text-travel-500 bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              />
              {t(level.labelKey)}（{level.suggestedPerDay}/天）
            </label>
          ))}
        </div>
        <div className="mt-2">
          <span className={labelClass}>{t("market_guideFee")}</span>
          <p className="text-small font-medium text-white mt-1">
            {budgetBreakdown.guideTotal}
            {t("ui_currency_suffix_usdc")}
          </p>
          <p className="text-meta text-white/60">{t("market_guideFeeFixedByLevel")}</p>
        </div>
      </div>
      <div>
        <span className={labelClass}>{t("market_transportFeeTotal")}</span>
        <p className="text-meta text-white/70 mt-0.5">{t("market_transportFeeFromSelection")}</p>
        <div className="mt-2 space-y-1.5 rounded-[var(--radius-sm)] border border-white/20 bg-white/5 px-3 py-2">
          {touristCityTransportLines.length > 0 ? (
            touristCityTransportLines.map((line, idx) => (
              <p key={idx} className="text-meta text-white/90">
                {line.dayFrom === line.dayTo
                  ? t("market_dayN").replace(/\{n\}/g, String(line.dayFrom))
                  : t("market_dayRange").replace("{{from}}", String(line.dayFrom)).replace("{{to}}", String(line.dayTo))}
                ：{t(CITY_TRANSPORT_OPTIONS.find((o) => o.value === line.vehicle)!.labelKey)}，{line.fee}
                {t("ui_currency_suffix_usdc")}
              </p>
            ))
          ) : (
            <p className="text-meta text-white/60">{t("market_guideCityTransportNoSelection")}</p>
          )}
          {hasTouristInterCity &&
            touristInterCityTransportLines.map((line, idx) => (
              <p key={idx} className="text-meta text-white/90">
                {t("market_dayN").replace(/\{n\}/g, String(line.dayFrom))}→{t("market_dayN").replace(/\{n\}/g, String(line.dayTo))}：{t(TRANSPORT_OPTIONS.find((o) => o.value === line.mode)!.labelKey)}，{line.fee}
                {t("ui_currency_suffix_usdc")}
                <span className="text-white/60 ml-1">
                  （{line.pricePerPerson}
                  {t("ui_currency_suffix_usdc_per_person")}×{line.headcount}
                  {t("market_perPersonUnit")}）
                </span>
              </p>
            ))}
          <p className="text-small font-medium text-white pt-1 border-t border-white/20">
            {t("market_transportFee")}：{suggestedTransportFee}
            {t("ui_currency_suffix_usdc")}
          </p>
        </div>
        <p className="text-meta text-white/60 mt-1">{t("market_transportFeeFixed")}</p>
      </div>
    </div>
  );
}
