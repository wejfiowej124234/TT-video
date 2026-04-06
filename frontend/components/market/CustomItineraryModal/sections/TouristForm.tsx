"use client";

import { useId } from "react";
import { COUNTRY_OPTIONS } from "@/lib/geoOptions";
import GlassSelect from "@/components/market/GlassSelect";
import type { TouristFormProps } from "../types";
import { TOTAL_DAYS_OPTIONS } from "../constants";
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
  return (
    <>
      <div>
        <label htmlFor={totalDaysFieldId} className={labelClass}>
          {t("market_totalDays")} *
        </label>
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
          options={COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
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

      {submitError && (
        <p id={submitErrorNoticeId} ref={submitErrorRef as React.RefObject<HTMLParagraphElement> | undefined} className="text-small text-warning" role="alert">
          {submitError}
        </p>
      )}
    </>
  );
}
