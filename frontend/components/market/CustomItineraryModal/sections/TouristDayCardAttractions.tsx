"use client";

import { useCatalogPoiDetails } from "@/lib/catalogApi/useCatalogPoi";
import type { AttractionDetail } from "@/lib/cityDetails";
import type { DayPlan } from "../types";
import { ItineraryMediaPreviewCard, ItineraryMediaPreviewRow } from "../ItineraryMediaPreviewCard";

export interface TouristDayCardAttractionsProps {
  day: DayPlan;
  dayIndex: number;
  countryNameZh: string;
  setDayPlan: (dayIndex: number, patch: Partial<DayPlan>) => void;
  setViewingAttraction: (v: AttractionDetail | null) => void;
  labelClass: string;
  pillSelected: string;
  pillUnselected: string;
  t: (key: string) => string;
}

export default function TouristDayCardAttractions({
  day,
  dayIndex,
  countryNameZh,
  setDayPlan,
  setViewingAttraction,
  labelClass,
  pillSelected,
  pillUnselected,
  t,
}: TouristDayCardAttractionsProps) {
  const attractionDetails = useCatalogPoiDetails(day.city, countryNameZh, "attraction") as AttractionDetail[];
  const selectedAttractionsInOrder = day.attractions
    .map((v) => attractionDetails.find((a) => a.value === v))
    .filter((a): a is AttractionDetail => a != null);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className={labelClass}>{t("market_attractions")}</span>
        {day.attractions.length > 0 ? (
          <span className="text-meta text-ref-sun/85">
            {t("market_itinerary_selected_count").replace("{{n}}", String(day.attractions.length))}
          </span>
        ) : null}
      </div>
      {attractionDetails.length === 0 ? (
        <p className="mt-1 text-meta text-white/60">{t("market_attractions_empty_for_city")}</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("market_attractions")}>
          {attractionDetails.map((a) => {
            const selected = day.attractions.includes(a.value);
            return (
              <form
                key={a.value}
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  const next = selected ? day.attractions.filter((v) => v !== a.value) : [...day.attractions, a.value];
                  setDayPlan(dayIndex, { attractions: next });
                }}
              >
                <button type="submit" aria-pressed={selected} className={selected ? pillSelected : pillUnselected}>
                  {a.label}
                </button>
              </form>
            );
          })}
        </div>
      )}
      {selectedAttractionsInOrder.length > 0 ? (
        <ItineraryMediaPreviewRow>
          {selectedAttractionsInOrder.map((a) => (
            <ItineraryMediaPreviewCard
              key={a.value}
              imageSrc={a.image}
              title={a.label}
              description={a.description}
              previewAriaLabel={t("market_itinerary_media_preview_aria").replace("{{name}}", a.label)}
              onPreview={() => setViewingAttraction(a)}
            />
          ))}
        </ItineraryMediaPreviewRow>
      ) : null}
    </div>
  );
}
