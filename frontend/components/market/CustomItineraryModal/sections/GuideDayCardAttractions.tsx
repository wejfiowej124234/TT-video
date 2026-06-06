"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import Image from "next/image";
import type { GuideDayPlan } from "../types";
import { MAX_COVER_FILE_SIZE } from "../constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

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
  return (
    <div>
      <span className={labelClass}>{t("market_attractions")}</span>
      <p className="text-meta text-white/60 mb-1">{t("market_guideUploadPhotoHint")}</p>
      <div className="flex flex-wrap gap-2 items-center">
        <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-start rounded-[var(--radius-sm)] border border-ref-sun/24 bg-ink-900/55 px-3 py-2 text-small text-white hover:bg-white/10 {CIM_FOCUS_WITHIN}">
          <span className="sr-only">{t("market_attractions")}</span>
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
        {(day.attractionImage ?? "") && (
          <>
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                setViewingGuideImage({ label: t("market_attractions"), url: day.attractionImage });
              }}
            >
              <button
                type="submit"
                className="shrink-0 w-36 rounded-[var(--radius-sm)] border border-ref-sun/16 bg-ink-950/60 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                <div className="relative aspect-[4/3] bg-slate-800">
                  <Image
                    src={day.attractionImage}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setGuideDayPlan(dayIndex, { attractionImage: "" })}
                  />
                </div>
                <p className="p-2 text-smallall font-medium text-white truncate">{t("market_attractions")}</p>
              </button>
            </form>
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                setGuideDayPlan(dayIndex, { attractionImage: "" });
              }}
            >
              <button
                type="submit"
                className={`${touchTargetLink44Classes} text-meta text-white/80 hover:text-white border border-ref-sun/24 rounded-[var(--radius-sm)] px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]`}
              >
                {t("market_coverClear")}
              </button>
            </form>
          </>
        )}
      </div>
      <label className="block mt-2 text-meta text-white/80">{t("market_guideAttractionsDesc")}</label>
      <input
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
