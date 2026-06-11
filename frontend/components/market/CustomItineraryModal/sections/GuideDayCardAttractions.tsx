"use client";

import type { GuideDayPlan } from "../types";
import { MAX_COVER_FILE_SIZE } from "../constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { CIM_FOCUS_WITHIN } from "../customItineraryModalTheme";
import { ItineraryMediaPreviewCard } from "../ItineraryMediaPreviewCard";
import { marketStudioModalGlassFileTriggerLabelInline } from "@/components/market/marketStudioModalLayout";

export interface GuideDayCardAttractionsProps {
  day: GuideDayPlan;
  dayIndex: number;
  setGuideDayPlan: (dayIndex: number, patch: Partial<GuideDayPlan>) => void;
  setViewingGuideImage: (v: { label: string; url: string } | null) => void;
  labelClass: string;
  inputClass: string;
  t: (key: string) => string;
}

export default function GuideDayCardAttractions({
  day,
  dayIndex,
  setGuideDayPlan,
  setViewingGuideImage,
  labelClass,
  inputClass,
  t,
}: GuideDayCardAttractionsProps) {
  const attractionLabel = t("market_attractions");
  return (
    <div>
      <span className={labelClass}>{attractionLabel}</span>
      <p className="mb-1 text-meta text-white/60">{t("market_guideUploadPhotoHint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className={`${marketStudioModalGlassFileTriggerLabelInline} ${CIM_FOCUS_WITHIN}`}>
          <span className="sr-only">{attractionLabel}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file || file.size > MAX_COVER_FILE_SIZE) return;
              const reader = new FileReader();
              reader.onload = () => setGuideDayPlan(dayIndex, { attractionImage: reader.result as string });
              reader.readAsDataURL(file);
            }}
          />
          {t("market_coverUpload")}
        </label>
        {(day.attractionImage ?? "") ? (
          <div className="mt-2 flex flex-wrap items-start gap-2">
            <ItineraryMediaPreviewCard
              imageSrc={day.attractionImage}
              title={attractionLabel}
              previewAriaLabel={t("market_itinerary_media_preview_aria").replace("{{name}}", attractionLabel)}
              onPreview={() => setViewingGuideImage({ label: attractionLabel, url: day.attractionImage })}
              rawImageSrc
              onImageError={() => setGuideDayPlan(dayIndex, { attractionImage: "" })}
            />
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                setGuideDayPlan(dayIndex, { attractionImage: "" });
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
      <label className="mt-2 block text-meta text-white/80" htmlFor={`guide-attractions-desc-${dayIndex}`}>
        {t("market_guideAttractionsDesc")}
      </label>
      <input
        id={`guide-attractions-desc-${dayIndex}`}
        type="text"
        value={day.attractions ?? ""}
        onChange={(e) => setGuideDayPlan(dayIndex, { attractions: e.target.value.slice(0, 200) })}
        maxLength={200}
        className={inputClass}
        placeholder={t("market_guideAttractionsPlaceholder")}
      />
    </div>
  );
}
