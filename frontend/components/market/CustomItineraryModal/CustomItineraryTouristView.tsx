"use client";

import TouristForm from "./sections/TouristForm";
import type { FormSectionStyles, GuideLevelOptionWithPricing } from "./types";
import type { ItineraryFormBag } from "./useItineraryForm";

export interface CustomItineraryTouristViewProps {
  styles: FormSectionStyles;
  guideLevelsWithPricing: GuideLevelOptionWithPricing[];
  bag: ItineraryFormBag;
  /** 与外层 `CustomItineraryModal` `aria-describedby` 同源，须由父级 `useId()` 生成 */
  submitErrorNoticeId: string;
  t: (key: string) => string;
}

/** 游客创建视图：组合 `useItineraryForm` + `quote` → `TouristForm`（与 index 原 `touristProps` 同源） */
export default function CustomItineraryTouristView({
  styles,
  guideLevelsWithPricing,
  bag,
  submitErrorNoticeId,
  t,
}: CustomItineraryTouristViewProps) {
  const {
    form,
    setForm,
    setDayPlan,
    setTotalDays,
    cities,
    quote,
    setViewingAttraction,
    setViewingFood,
    setViewingVehicle,
    setViewingHotel,
    submitErrorRef,
    submitError,
    userHasEditedBudgetRef,
    coverFileTooBig,
    setCoverFileTooBig,
  } = bag;

  const {
    budgetBreakdown,
    budgetSuggestion,
    suggestedCityTransportFee,
    suggestedInterCityFee,
    suggestedTransportFee,
    touristCityTransportLines,
    hasTouristInterCity,
    touristInterCityTransportLines,
  } = quote;

  return (
    <TouristForm
      {...styles}
      guideLevelsWithPricing={guideLevelsWithPricing}
      form={form}
      setForm={setForm}
      setDayPlan={setDayPlan}
      setTotalDays={setTotalDays}
      cities={cities}
      budgetBreakdown={budgetBreakdown}
      budgetSuggestion={budgetSuggestion}
      suggestedCityTransportFee={suggestedCityTransportFee}
      suggestedInterCityFee={suggestedInterCityFee}
      suggestedTransportFee={suggestedTransportFee}
      touristCityTransportLines={touristCityTransportLines}
      hasTouristInterCity={hasTouristInterCity}
      touristInterCityTransportLines={touristInterCityTransportLines}
      setViewingAttraction={setViewingAttraction}
      setViewingFood={setViewingFood}
      setViewingVehicle={setViewingVehicle}
      setViewingHotel={setViewingHotel}
      submitErrorRef={submitErrorRef}
      submitError={submitError}
      submitErrorNoticeId={submitErrorNoticeId}
      userHasEditedBudgetRef={userHasEditedBudgetRef}
      coverFileTooBig={coverFileTooBig}
      setCoverFileTooBig={setCoverFileTooBig}
      t={t}
    />
  );
}
