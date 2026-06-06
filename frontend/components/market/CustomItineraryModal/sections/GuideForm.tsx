"use client";

import { useId } from "react";
import { COUNTRY_OPTIONS } from "@/lib/geoOptions";
import GlassSelect from "@/components/market/GlassSelect";
import CustomItineraryTotalDaysPills from "../CustomItineraryTotalDaysPills";
import type { GuideFormProps } from "../types";
import { TOTAL_DAYS_OPTIONS, TITLE_MAX_LENGTH } from "../constants";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import GuideDayCard from "./GuideDayCard";
import GuideFeeAndTransportSection from "./GuideFeeAndTransportSection";
import GuideFormQuoteAndCoverSection from "./GuideFormQuoteAndCoverSection";

export default function GuideForm({
  guideLevelsWithPricing,
  form,
  setForm,
  setTotalDays,
  setGuideDayPlan,
  cities,
  guideDayPlansNormalized,
  guideQuoteBreakdown,
  suggestedGuideCityTransportFee,
  suggestedGuideInterCityFee,
  hasGuideInterCity,
  guideCityTransportLines,
  guideInterCityTransportLines,
  setViewingGuideImage,
  viewingGuideImage,
  setViewingVehicle,
  setViewingHotel,
  submitErrorRef,
  submitError,
  submitErrorNoticeId,
  guideHasEditedAmountRef,
  accountAvatarUrl,
  coverFileTooBig,
  setCoverFileTooBig,
  labelClass,
  inputClass,
  descClass,
  pillSelected,
  pillUnselected,
  t,
}: GuideFormProps) {
  const totalDaysFieldId = useId();
  const countryFieldId = useId();
  const titleFieldId = useId();
  return (
    <>
      <p className="text-meta text-white/80 mb-4">{t("market_guideFormDesc")}</p>

      <div className="space-y-2">
        <span id={totalDaysFieldId} className={labelClass}>
          {t("market_totalDays")} *
        </span>
        <CustomItineraryTotalDaysPills
          value={form.totalDays}
          onChange={setTotalDays}
          pillSelected={pillSelected}
          pillIdle={pillUnselected}
          focusRingClass={TT_MARKETING_MARKET_DARK_PATH.drawerControlFocus}
          groupAriaLabel={t("market_totalDays")}
          dayLabel={(n) => t("market_dayUnit").replace("{{n}}", String(n))}
        />
        <p className="text-meta text-slate-400">{t("market_totalDays_select_hint")}</p>
        <GlassSelect
          id={totalDaysFieldId}
          value={form.totalDays}
          onChange={(v) => setTotalDays(Number(v))}
          options={TOTAL_DAYS_OPTIONS.map((d) => ({ value: d, label: t("market_dayUnit").replace("{{n}}", String(d)) }))}
          aria-label={t("market_totalDays")}
        />
      </div>
      <div>
        <label htmlFor={countryFieldId} className={labelClass}>
          {t("market_country")} *
        </label>
        <GlassSelect
          id={countryFieldId}
          value={form.country}
          onChange={(v) =>
            setForm((f) => ({
              ...f,
              country: String(v),
              guideDayPlans: (f.guideDayPlans ?? []).map((d) => ({ ...d, city: "", transport: undefined, hotel: "" })),
            }))
          }
          options={COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
          placeholder={t("market_selectCountryFirst")}
          aria-label={t("market_country")}
        />
      </div>
      <div>
        <label htmlFor={titleFieldId} className={labelClass}>
          {t("market_itineraryTitle")}
        </label>
        <input
          id={titleFieldId}
          type="text"
          maxLength={TITLE_MAX_LENGTH}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, TITLE_MAX_LENGTH) }))}
          className={inputClass}
          placeholder={t("market_itineraryTitlePlaceholder")}
        />
        <p className="text-meta text-white/50 mt-0.5">{t("market_titleLength").replace("{{n}}", String(form.title.length))}</p>
      </div>

      {form.country &&
        guideDayPlansNormalized.map((day, dayIndex) => (
          <GuideDayCard
            key={dayIndex}
            day={day}
            dayIndex={dayIndex}
            form={form}
            prevCity={dayIndex >= 1 ? (guideDayPlansNormalized[dayIndex - 1]?.city ?? "").trim() : ""}
            setGuideDayPlan={setGuideDayPlan}
            cities={cities}
            labelClass={labelClass}
            inputClass={inputClass}
            pillSelected={pillSelected}
            pillUnselected={pillUnselected}
            setViewingGuideImage={setViewingGuideImage}
            setViewingVehicle={setViewingVehicle}
            setViewingHotel={setViewingHotel}
            t={t}
          />
        ))}

      <GuideFeeAndTransportSection
        guideLevelsWithPricing={guideLevelsWithPricing}
        form={form}
        setForm={setForm}
        guideQuoteBreakdown={guideQuoteBreakdown}
        guideCityTransportLines={guideCityTransportLines}
        guideInterCityTransportLines={guideInterCityTransportLines}
        hasGuideInterCity={hasGuideInterCity}
        labelClass={labelClass}
        t={t}
      />

      <GuideFormQuoteAndCoverSection
        form={form}
        setForm={setForm}
        guideQuoteBreakdown={guideQuoteBreakdown}
        hasGuideInterCity={hasGuideInterCity}
        labelClass={labelClass}
        inputClass={inputClass}
        guideHasEditedAmountRef={guideHasEditedAmountRef}
        setViewingGuideImage={setViewingGuideImage}
        viewingGuideImage={viewingGuideImage}
        submitErrorRef={submitErrorRef}
        submitError={submitError}
        submitErrorNoticeId={submitErrorNoticeId}
        coverFileTooBig={coverFileTooBig}
        setCoverFileTooBig={setCoverFileTooBig}
        t={t}
      />
    </>
  );
}
