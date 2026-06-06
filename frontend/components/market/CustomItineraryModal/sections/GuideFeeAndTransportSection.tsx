"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import type { CustomItineraryForm, GuideLevelOptionWithPricing } from "../types";
import type { GuideQuoteBreakdown, TransportLine, InterCityLine } from "../useQuoteCalculation";
import { CITY_TRANSPORT_OPTIONS, TRANSPORT_OPTIONS } from "../constants";

export interface GuideFeeAndTransportSectionProps {
  guideLevelsWithPricing: GuideLevelOptionWithPricing[];
  form: CustomItineraryForm;
  setForm: React.Dispatch<React.SetStateAction<CustomItineraryForm>>;
  guideQuoteBreakdown: GuideQuoteBreakdown;
  guideCityTransportLines: TransportLine[];
  guideInterCityTransportLines: InterCityLine[];
  hasGuideInterCity: boolean;
  labelClass: string;
  t: (key: string) => string;
}

/** 向导表单：我的等级/费用 + 交通费明细（43 再拆以控制 GuideForm ≤400 行） */
export default function GuideFeeAndTransportSection({
  guideLevelsWithPricing,
  form,
  setForm,
  guideQuoteBreakdown,
  guideCityTransportLines,
  guideInterCityTransportLines,
  hasGuideInterCity,
  labelClass,
  t,
}: GuideFeeAndTransportSectionProps) {
  return (
    <div className={CIM.customItineraryPanelMd}>
      <h3 className="text-small font-semibold text-white drop-shadow-market-pill">
        {t("market_guideMyFeeAndTransport")}
      </h3>
      <div>
        <span className={labelClass}>{t("market_guideMyLevel")}</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {guideLevelsWithPricing.map((level) => (
            <label key={level.value} className="flex min-h-[44px] items-center justify-start gap-2 cursor-pointer text-small text-white">
              <input
                type="radio"
                name="guideNeedGuide"
                checked={form.needGuide === level.value}
                onChange={() =>
                  setForm((f) => ({
                    ...f,
                    needGuide: level.value as CustomItineraryForm["needGuide"],
                    guideFee: String(level.suggestedPerDay * f.totalDays),
                  }))
                }
                className={CIM_CHOICE}
              />
              {t(level.labelKey)}（{level.suggestedPerDay}/天）
            </label>
          ))}
        </div>
        <div className="mt-2">
          <span className={labelClass}>{t("market_guideMyFee")}</span>
          <p className="text-small font-medium text-white mt-1">
            {guideQuoteBreakdown.guideTotal}
            {t("ui_currency_suffix_usdc")}
          </p>
          <p className="text-meta text-white/60">{t("market_guideFeeFixedByLevel")}</p>
        </div>
      </div>
      <div>
        <span className={labelClass}>{t("market_transportFeeTotal")}</span>
        <p className="text-meta text-white/70 mt-0.5">{t("market_transportFeeFromSelection")}</p>
        <div className={CIM.customItineraryInsetRow}>
          {guideCityTransportLines.length > 0 ? (
            guideCityTransportLines.map((line, idx) => (
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
          {hasGuideInterCity &&
            guideInterCityTransportLines.map((line, idx) => (
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
          <p className="text-small font-medium text-white pt-1 border-t border-ref-sun/14">
            {t("market_transportFee")}：{guideQuoteBreakdown.cityTransportFee + guideQuoteBreakdown.interCityFee}
            {t("ui_currency_suffix_usdc")}
          </p>
        </div>
        <p className="text-meta text-white/60 mt-1">{t("market_transportFeeFixed")}</p>
      </div>
    </div>
  );
}
