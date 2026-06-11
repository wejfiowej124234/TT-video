"use client";

import type { GuideDayPlan } from "../types";
import { TRANSPORT_OPTIONS } from "../constants";
import {
  getInterCityTransportLabelKey,
  getInterCityTransportModes,
  normalizeInterCityTransport,
} from "@/lib/cityDetails";

export interface GuideDayCardCrossCityAndCityProps {
  day: GuideDayPlan;
  dayIndex: number;
  prevCity: string;
  setGuideDayPlan: (dayIndex: number, patch: Partial<GuideDayPlan>) => void;
  cities: { value: string; label: string }[];
  labelClass: string;
  pillSelected: string;
  pillUnselected: string;
  t: (key: string) => string;
}

export default function GuideDayCardCrossCityAndCity({
  day,
  dayIndex,
  prevCity,
  setGuideDayPlan,
  cities,
  labelClass,
  pillSelected,
  pillUnselected,
  t,
}: GuideDayCardCrossCityAndCityProps) {
  const dayCity = (day.city ?? "").trim();
  const interCityModes =
    dayIndex >= 1 && dayCity ? getInterCityTransportModes(prevCity, dayCity) : [];
  const transportOptions = TRANSPORT_OPTIONS.filter((opt) => interCityModes.includes(opt.value));

  return (
    <>
      <div>
        <span className={labelClass}>{t("market_city")} *</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {cities.map((c) => {
            const selected = dayCity === c.value;
            return (
              <form
                key={c.value}
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  const isSameAsPrev = dayIndex >= 1 && prevCity === c.value;
                  const transport = isSameAsPrev
                    ? undefined
                    : normalizeInterCityTransport(prevCity, c.value, day.transport);
                  setGuideDayPlan(dayIndex, {
                    city: c.value,
                    transport,
                  });
                }}
              >
                <button type="submit" className={selected ? pillSelected : pillUnselected}>
                  {c.label}
                </button>
              </form>
            );
          })}
        </div>
      </div>
      {dayIndex >= 1 && prevCity ? (
        <div>
          <span className={labelClass}>{t("market_transportCrossCity")}</span>
          {!dayCity ? (
            <p className="text-meta text-white/60 mt-1">{t("market_selectCityFirst")}</p>
          ) : prevCity === dayCity ? (
            <p className="text-meta text-white/60 mt-1">{t("market_sameCityNoCross")}</p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-1">
              {transportOptions.map((opt) => {
                const normalized = normalizeInterCityTransport(prevCity, dayCity, day.transport);
                const selected =
                  day.transport === opt.value || (day.transport == null && normalized === opt.value);
                return (
                  <form
                    key={opt.value}
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setGuideDayPlan(dayIndex, { transport: opt.value });
                    }}
                  >
                    <button type="submit" className={selected ? pillSelected : pillUnselected}>
                      {t(getInterCityTransportLabelKey(opt.value, prevCity, dayCity))}
                    </button>
                  </form>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
