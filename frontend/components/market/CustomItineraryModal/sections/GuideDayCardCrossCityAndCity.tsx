"use client";

import type { GuideDayPlan } from "../types";
import { TRANSPORT_OPTIONS } from "../constants";

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
  const sameCityAsPrev = dayIndex >= 1 && prevCity === (day.city ?? "").trim();
  return (
    <>
      {dayIndex >= 1 && (
        <div>
          <span className={labelClass}>{t("market_transportCrossCity")}</span>
          {sameCityAsPrev ? (
            <p className="text-meta text-white/60 mt-1">{t("market_sameCityNoCross")}</p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-1">
              {TRANSPORT_OPTIONS.map((opt) => {
                const selected = day.transport === opt.value || (day.transport == null && opt.value === "rail");
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
                      {t(opt.labelKey)}
                    </button>
                  </form>
                );
              })}
            </div>
          )}
        </div>
      )}
      <div>
        <span className={labelClass}>{t("market_city")} *</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {cities.map((c) => {
            const selected = (day.city ?? "") === c.value;
            return (
              <form
                key={c.value}
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  setGuideDayPlan(dayIndex, {
                    city: c.value,
                    ...(dayIndex >= 1 && prevCity === c.value ? { transport: undefined } : {}),
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
    </>
  );
}
