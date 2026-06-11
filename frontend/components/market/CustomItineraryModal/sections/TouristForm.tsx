"use client";

import { useId } from "react";
import { useCatalogCountryOptions } from "@/lib/catalogApi/useCatalogGeo";
import GlassSelect from "@/components/market/GlassSelect";
import CustomItineraryTotalDaysPills from "../CustomItineraryTotalDaysPills";
import type { TouristFormProps } from "../types";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import CustomItineraryFormProgress from "../CustomItineraryFormProgress";
import TouristDayCard from "./TouristDayCard";
import TouristGuideAndTransportSection from "./TouristGuideAndTransportSection";
import TouristQuoteSummaryBlock from "./TouristQuoteSummaryBlock";
import TouristBudgetMetaFields from "./TouristBudgetMetaFields";
import TouristCoverImageField from "./TouristCoverImageField";

export default function TouristForm({
  guideLevelsWithPricing,
  form,
  setForm,
  setDayPlan,
  setTotalDays,
  cities,
  budgetBreakdown,
  budgetSuggestion,
  suggestedCityTransportFee,
  suggestedInterCityFee,
  suggestedTransportFee,
  touristCityTransportLines,
  hasTouristInterCity,
  touristInterCityTransportLines,
  setViewingAttraction,
  setViewingFood,
  setViewingVehicle,
  setViewingHotel,
  submitErrorRef,
  submitError,
  submitErrorNoticeId,
  userHasEditedBudgetRef,
  coverFileTooBig,
  setCoverFileTooBig,
  labelClass,
  inputClass,
  pillSelected,
  pillUnselected,
  t,
}: TouristFormProps) {
  const totalDaysFieldId = useId();
  const countryFieldId = useId();
  const countryOptions = useCatalogCountryOptions();
  return (
    <>
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
      </div>

      {form.country ? <CustomItineraryFormProgress form={form} t={t} /> : null}

      <p className="rounded-[var(--radius-sm)] border border-ref-sun/16 bg-ink-900/45 px-3 py-2 text-meta text-white/85">
        {t("market_itinerary_tourist_mode_hint")}
      </p>

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
              dayPlans: f.dayPlans.map((d) => ({
                ...d,
                city: "",
                attractions: [],
                food: [],
                hotel: "",
                cityTransport: undefined,
                transport: undefined,
              })),
            }))
          }
          options={countryOptions.map((c) => ({ value: c.value, label: c.label }))}
          placeholder={t("market_selectCountryFirst")}
          aria-label={t("market_country")}
        />
      </div>

      {form.country &&
        form.dayPlans.map((day, dayIndex) => (
          <TouristDayCard
            key={dayIndex}
            day={day}
            dayIndex={dayIndex}
            form={form}
            setDayPlan={setDayPlan}
            cities={cities}
            labelClass={labelClass}
            pillSelected={pillSelected}
            pillUnselected={pillUnselected}
            setViewingAttraction={setViewingAttraction}
            setViewingFood={setViewingFood}
            setViewingVehicle={setViewingVehicle}
            setViewingHotel={setViewingHotel}
            t={t}
          />
        ))}

      {form.country ? (
        <TouristGuideAndTransportSection
          guideLevelsWithPricing={guideLevelsWithPricing}
          form={form}
          setForm={setForm}
          budgetBreakdown={budgetBreakdown}
          touristCityTransportLines={touristCityTransportLines}
          hasTouristInterCity={hasTouristInterCity}
          touristInterCityTransportLines={touristInterCityTransportLines}
          suggestedTransportFee={suggestedTransportFee}
          labelClass={labelClass}
          t={t}
        />
      ) : null}

      {form.country && (
        <TouristQuoteSummaryBlock
          budgetBreakdown={budgetBreakdown}
          suggestedCityTransportFee={suggestedCityTransportFee}
          suggestedInterCityFee={suggestedInterCityFee}
          t={t}
        />
      )}

      <TouristBudgetMetaFields
        form={form}
        setForm={setForm}
        budgetBreakdown={budgetBreakdown}
        budgetSuggestion={budgetSuggestion}
        userHasEditedBudgetRef={userHasEditedBudgetRef}
        labelClass={labelClass}
        inputClass={inputClass}
        t={t}
      />

      <TouristCoverImageField
        form={form}
        setForm={setForm}
        coverFileTooBig={coverFileTooBig}
        setCoverFileTooBig={setCoverFileTooBig}
        inputClass={inputClass}
        labelClass={labelClass}
        t={t}
      />

      {submitError ? (
        <p
          id={submitErrorNoticeId}
          ref={submitErrorRef as React.RefObject<HTMLParagraphElement> | undefined}
          className="sr-only"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}
    </>
  );
}
