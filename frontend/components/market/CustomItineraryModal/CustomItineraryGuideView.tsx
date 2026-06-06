"use client";

import GuideForm from "./sections/GuideForm";
import type { FormSectionStyles, GuideLevelOptionWithPricing } from "./types";
import type { ItineraryFormBag } from "./useItineraryForm";

export interface CustomItineraryGuideViewProps {
  styles: FormSectionStyles;
  guideLevelsWithPricing: GuideLevelOptionWithPricing[];
  bag: ItineraryFormBag;
  /** 与外层 `CustomItineraryModal` `aria-describedby` 同源，须由父级 `useId()` 生成 */
  submitErrorNoticeId: string;
  t: (key: string) => string;
}

/** 向导创建视图：组合 `useItineraryForm` + `quote` → `GuideForm`（与 index 原 `guideProps` 同源） */
export default function CustomItineraryGuideView({
  styles,
  guideLevelsWithPricing,
  bag,
  submitErrorNoticeId,
  t,
}: CustomItineraryGuideViewProps) {
  const {
    form,
    setForm,
    setGuideDayPlan,
    cities,
    quote,
    setViewingGuideImage,
    viewingGuideImage,
    setViewingVehicle,
    setViewingHotel,
    submitErrorRef,
    submitError,
    guideHasEditedAmountRef,
    accountAvatarUrl,
    coverFileTooBig,
    setCoverFileTooBig,
  } = bag;

  const {
    guideDayPlansNormalized,
    guideQuoteBreakdown,
    suggestedGuideCityTransportFee,
    suggestedGuideInterCityFee,
    hasGuideInterCity,
    guideCityTransportLines,
    guideInterCityTransportLines,
  } = quote;

  return (
    <GuideForm
      {...styles}
      guideLevelsWithPricing={guideLevelsWithPricing}
      form={form}
      setForm={setForm}
      setGuideDayPlan={setGuideDayPlan}
      cities={cities}
      guideDayPlansNormalized={guideDayPlansNormalized}
      guideQuoteBreakdown={guideQuoteBreakdown}
      suggestedGuideCityTransportFee={suggestedGuideCityTransportFee}
      suggestedGuideInterCityFee={suggestedGuideInterCityFee}
      hasGuideInterCity={hasGuideInterCity}
      guideCityTransportLines={guideCityTransportLines}
      guideInterCityTransportLines={guideInterCityTransportLines}
      setViewingGuideImage={setViewingGuideImage}
      viewingGuideImage={viewingGuideImage}
      setViewingVehicle={setViewingVehicle}
      setViewingHotel={setViewingHotel}
      submitErrorRef={submitErrorRef}
      submitError={submitError}
      submitErrorNoticeId={submitErrorNoticeId}
      guideHasEditedAmountRef={guideHasEditedAmountRef}
      accountAvatarUrl={accountAvatarUrl}
      coverFileTooBig={coverFileTooBig}
      setCoverFileTooBig={setCoverFileTooBig}
      t={t}
    />
  );
}
