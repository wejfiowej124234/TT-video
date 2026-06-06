"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import Image from "next/image";
import { getAttractionDetails } from "@/lib/cityDetails";
import type { AttractionDetail } from "@/lib/cityDetails";
import type { DayPlan } from "../types";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export interface TouristDayCardAttractionsProps {
  day: DayPlan;
  dayIndex: number;
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
  setDayPlan,
  setViewingAttraction,
  labelClass,
  pillSelected,
  pillUnselected,
  t,
}: TouristDayCardAttractionsProps) {
  const attractionDetails = getAttractionDetails(day.city);
  const selectedAttractionsInOrder = day.attractions
    .map((v) => attractionDetails.find((a) => a.value === v))
    .filter((a): a is AttractionDetail => a != null);

  return (
    <div>
      <span className={labelClass}>{t("market_attractions")}</span>
      <div className="flex flex-wrap gap-2 mt-1">
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
              <button type="submit" className={selected ? pillSelected : pillUnselected}>
                {a.label}
              </button>
            </form>
          );
        })}
      </div>
      {selectedAttractionsInOrder.length > 0 && (
        <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
          {selectedAttractionsInOrder.map((a) => (
            <form
              key={a.value}
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                setViewingAttraction(a);
              }}
            >
              <button
                type="submit"
                className="shrink-0 w-36 rounded-[var(--radius-sm)] border border-ref-sun/16 bg-ink-950/60 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                <div className="relative aspect-[4/3] bg-ink-800">
                  <Image
                    src={communityMediaAbsoluteUrlForRender(a.image)}
                    alt={a.label}
                    fill
                    className="object-cover"
                    sizes="144px"
                    unoptimized={communityMediaNextImageUnoptimized(communityMediaAbsoluteUrlForRender(a.image))}
                  />
                </div>
                <p className="p-3 text-small font-medium text-white truncate">{a.label}</p>
                <p className="px-3 pb-3 text-meta text-white/80 line-clamp-2">{a.description}</p>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
