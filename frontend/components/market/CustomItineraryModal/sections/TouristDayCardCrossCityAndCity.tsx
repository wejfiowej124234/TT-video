"use client";

import type { CustomItineraryForm, DayPlan } from "../types";
import { TRANSPORT_OPTIONS } from "../constants";

export interface TouristDayCardCrossCityAndCityProps {
  day: DayPlan;
  dayIndex: number;
  form: CustomItineraryForm;
  setDayPlan: (dayIndex: number, patch: Partial<DayPlan>) => void;
  cities: { value: string; label: string }[];
  labelClass: string;
  pillSelected: string;
  pillUnselected: string;
  t: (key: string) => string;
}

export default function TouristDayCardCrossCityAndCity({
  day,
  dayIndex,
  form,
  setDayPlan,
  cities,
  labelClass,
  pillSelected,
  pillUnselected,
  t,
}: TouristDayCardCrossCityAndCityProps) {
  return (
    <>
      {dayIndex >= 1 && (
        <div>
          <span className={labelClass}>{t("market_transportCrossCity")}</span>
          {form.dayPlans[dayIndex - 1]?.city?.trim() === day.city?.trim() ? (
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
                      setDayPlan(dayIndex, { transport: opt.value });
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
        {!form.country ? (
          <span className="text-small text-white/60">{t("market_selectCountryFirst")}</span>
        ) : (
          <div className="flex flex-wrap gap-2 mt-1">
            {cities.map((c) => {
              const selected = day.city === c.value;
              return (
                <form
                  key={c.value}
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const prevCity = form.dayPlans[dayIndex - 1]?.city?.trim();
                    const isSameAsPrev = dayIndex >= 1 && prevCity === c.value;
                    setDayPlan(dayIndex, {
                      city: c.value,
                      attractions: [],
                      food: [],
                      hotel: "",
                      ...(isSameAsPrev ? { transport: undefined } : {}),
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
        )}
      </div>
    </>
  );
}
