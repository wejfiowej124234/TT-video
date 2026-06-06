"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import Image from "next/image";
import { getFoodDetails } from "@/lib/cityDetails";
import type { FoodDetail } from "@/lib/cityDetails";
import type { DayPlan } from "../types";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export interface TouristDayCardFoodProps {
  day: DayPlan;
  dayIndex: number;
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
  setDayPlan,
  setViewingFood,
  labelClass,
  pillSelected,
  pillUnselected,
  t,
}: TouristDayCardFoodProps) {
  const foodDetails = getFoodDetails(day.city);
  const selectedFoodInOrder = day.food
    .map((v) => foodDetails.find((f) => f.value === v))
    .filter((f): f is FoodDetail => f != null);

  return (
    <div>
      <span className={labelClass}>{t("market_food")}</span>
      <div className="flex flex-wrap gap-2 mt-1">
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
              <button type="submit" className={selected ? pillSelected : pillUnselected}>
                {f.label}
              </button>
            </form>
          );
        })}
      </div>
      {selectedFoodInOrder.length > 0 && (
        <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
          {selectedFoodInOrder.map((f) => (
            <form
              key={f.value}
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                setViewingFood(f);
              }}
            >
              <button
                type="submit"
                className="shrink-0 w-36 rounded-[var(--radius-sm)] border border-ref-sun/16 bg-ink-950/60 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                <div className="relative aspect-[4/3] bg-ink-800">
                  <Image
                    src={communityMediaAbsoluteUrlForRender(f.image)}
                    alt={f.label}
                    fill
                    className="object-cover"
                    sizes="144px"
                    unoptimized={communityMediaNextImageUnoptimized(communityMediaAbsoluteUrlForRender(f.image))}
                  />
                </div>
                <p className="p-3 text-small font-medium text-white truncate">{f.label}</p>
                <p className="px-3 pb-3 text-meta text-white/80 line-clamp-2">{f.description}</p>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
