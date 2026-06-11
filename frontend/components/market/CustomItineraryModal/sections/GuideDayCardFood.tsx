"use client";

import type { GuideDayPlan } from "../types";
import { MAX_COVER_FILE_SIZE } from "../constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { CIM_FOCUS_WITHIN } from "../customItineraryModalTheme";
import { ItineraryMediaPreviewCard } from "../ItineraryMediaPreviewCard";
import { marketStudioModalGlassFileTriggerLabelInline } from "@/components/market/marketStudioModalLayout";

export interface GuideDayCardFoodProps {
  day: GuideDayPlan;
  dayIndex: number;
  setGuideDayPlan: (dayIndex: number, patch: Partial<GuideDayPlan>) => void;
  setViewingGuideImage: (v: { label: string; url: string } | null) => void;
  labelClass: string;
  inputClass: string;
  t: (key: string) => string;
}

export default function GuideDayCardFood(props: GuideDayCardFoodProps) {
  const { day, dayIndex, setGuideDayPlan, setViewingGuideImage, labelClass, inputClass, t } = props;
  const foodLabel = t("market_food");
  return (
    <div>
      <span className={labelClass}>{foodLabel}</span>
      <p className="mb-1 text-meta text-white/60">{t("market_guideUploadPhotoHint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className={`${marketStudioModalGlassFileTriggerLabelInline} ${CIM_FOCUS_WITHIN}`}>
          <span className="sr-only">{t("market_guideFoodPhoto")}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file || file.size > MAX_COVER_FILE_SIZE) return;
              const reader = new FileReader();
              reader.onload = () => setGuideDayPlan(dayIndex, { foodImage: reader.result as string });
              reader.readAsDataURL(file);
            }}
          />
          {t("market_coverUpload")}
        </label>
        {(day.foodImage ?? "") ? (
          <div className="mt-2 flex flex-wrap items-start gap-2">
            <ItineraryMediaPreviewCard
              imageSrc={day.foodImage}
              title={foodLabel}
              previewAriaLabel={t("market_itinerary_media_preview_aria").replace("{{name}}", foodLabel)}
              onPreview={() => setViewingGuideImage({ label: foodLabel, url: day.foodImage })}
              rawImageSrc
              onImageError={() => setGuideDayPlan(dayIndex, { foodImage: "" })}
            />
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                setGuideDayPlan(dayIndex, { foodImage: "" });
              }}
            >
              <button
                type="submit"
                className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ref-sun/24 px-2 py-1 text-meta text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]`}
              >
                {t("market_coverClear")}
              </button>
            </form>
          </div>
        ) : null}
      </div>
      <label className="mt-2 block text-meta text-white/80" htmlFor={`guide-food-desc-${dayIndex}`}>
        {t("market_guideFoodDesc")}
      </label>
      <input
        id={`guide-food-desc-${dayIndex}`}
        type="text"
        value={day.food ?? ""}
        onChange={(e) => setGuideDayPlan(dayIndex, { food: e.target.value.slice(0, 200) })}
        maxLength={200}
        className={inputClass}
        placeholder={t("market_guideFoodPlaceholder")}
      />
    </div>
  );
}
