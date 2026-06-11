"use client";

import { useCatalogPoiDetails } from "@/lib/catalogApi/useCatalogPoi";
import type { FoodDetail } from "@/lib/cityDetails";
import type { DayPlan } from "../types";
import { ItineraryMediaPreviewCard, ItineraryMediaPreviewRow } from "../ItineraryMediaPreviewCard";

export interface TouristDayCardFoodProps {
  day: DayPlan;
  dayIndex: number;
  countryNameZh: string;
  setDayPlan: (dayIndex: number, patch: Partial<DayPlan>) => void;
  setViewingFood: (v: FoodDetail | null) => void;
  labelClass: string;
  pillSelected: string;
  pillUnselected: string;
  t: (key: string) => string;
}

export default function TouristDayCardFood({
  day,
  dayIndex,
  countryNameZh,
  setDayPlan,
  setViewingFood,
  labelClass,
  pillSelected,
  pillUnselected,
  t,
}: TouristDayCardFoodProps) {
  const foodDetails = useCatalogPoiDetails(day.city, countryNameZh, "food") as FoodDetail[];
  const selectedFoodInOrder = day.food
    .map((v) => foodDetails.find((f) => f.value === v))
    .filter((f): f is FoodDetail => f != null);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className={labelClass}>{t("market_food")}</span>
        {day.food.length > 0 ? (
          <span className="text-meta text-ref-sun/85">
            {t("market_itinerary_selected_count").replace("{{n}}", String(day.food.length))}
          </span>
        ) : null}
      </div>
      {foodDetails.length === 0 ? (
        <p className="mt-1 text-meta text-white/60">{t("market_food_empty_for_city")}</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("market_food")}>
          {foodDetails.map((f) => {
            const selected = day.food.includes(f.value);
            return (
              <form
                key={f.value}
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  const next = selected ? day.food.filter((v) => v !== f.value) : [...day.food, f.value];
                  setDayPlan(dayIndex, { food: next });
                }}
              >
                <button type="submit" aria-pressed={selected} className={selected ? pillSelected : pillUnselected}>
                  {f.label}
                </button>
              </form>
            );
          })}
        </div>
      )}
      {selectedFoodInOrder.length > 0 ? (
        <ItineraryMediaPreviewRow>
          {selectedFoodInOrder.map((f) => (
            <ItineraryMediaPreviewCard
              key={f.value}
              imageSrc={f.image}
              title={f.label}
              description={f.description}
              previewAriaLabel={t("market_itinerary_media_preview_aria").replace("{{name}}", f.label)}
              onPreview={() => setViewingFood(f)}
            />
          ))}
        </ItineraryMediaPreviewRow>
      ) : null}
    </div>
  );
}
