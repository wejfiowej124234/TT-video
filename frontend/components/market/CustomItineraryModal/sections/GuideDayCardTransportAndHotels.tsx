"use client";

import Image from "next/image";
import type { HotelDetail } from "@/lib/cityDetails";
import type { CityTransportType, CustomItineraryForm, GuideDayPlan } from "../types";
import { CITY_TRANSPORT_OPTIONS, CITY_TRANSPORT_DETAILS, SEDAN_CAPACITY } from "../constants";

export interface GuideDayCardTransportAndHotelsProps {
  day: GuideDayPlan;
  dayIndex: number;
  form: CustomItineraryForm;
  setGuideDayPlan: (dayIndex: number, patch: Partial<GuideDayPlan>) => void;
  setViewingVehicle: (v: CityTransportType | null) => void;
  setViewingHotel: (v: HotelDetail | null) => void;
  guideHotels: { value: string; label: string }[];
  selectedGuideHotelDetail: HotelDetail | null;
  labelClass: string;
  pillSelected: string;
  pillUnselected: string;
  t: (key: string) => string;
}

export default function GuideDayCardTransportAndHotels({
  day,
  dayIndex,
  setGuideDayPlan,
  setViewingVehicle,
  setViewingHotel,
  guideHotels,
  selectedGuideHotelDetail,
  labelClass,
  pillSelected,
  pillUnselected,
  t,
  form,
}: GuideDayCardTransportAndHotelsProps) {
  return (
    <>
      <div>
        <span className={labelClass}>{t("market_transportInCity")}</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {CITY_TRANSPORT_OPTIONS.map((opt) => {
            const selected = day.cityTransport === opt.value;
            return (
              <form
                key={opt.value}
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  setGuideDayPlan(dayIndex, { cityTransport: opt.value });
                }}
              >
                <button type="submit" className={selected ? pillSelected : pillUnselected}>
                  {t(opt.labelKey)}
                </button>
              </form>
            );
          })}
        </div>
        {day.cityTransport && (
          <div className="mt-3 flex gap-3 items-start">
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                setViewingVehicle(day.cityTransport!);
              }}
            >
              <button
                type="submit"
                className="shrink-0 w-36 rounded-[var(--radius-sm)] border border-white/20 bg-slate-900/60 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-400"
              >
              <div className="relative aspect-[4/3] bg-slate-800">
                <Image
                  src={CITY_TRANSPORT_DETAILS[day.cityTransport!].image}
                  alt={t(CITY_TRANSPORT_OPTIONS.find((o) => o.value === day.cityTransport)!.labelKey)}
                  fill
                  className="object-cover"
                  sizes="144px"
                  unoptimized
                />
              </div>
              <p className="p-2 text-smallall font-medium text-white">
                {t(CITY_TRANSPORT_OPTIONS.find((o) => o.value === day.cityTransport)!.labelKey)}
              </p>
                  <p className="px-2 pb-2 text-meta text-white/80 line-clamp-2">
                    {t(CITY_TRANSPORT_DETAILS[day.cityTransport!].descriptionKey)}
                  </p>
                </button>
            </form>
          </div>
        )}
        {form.headcount > SEDAN_CAPACITY && day.cityTransport === "sedan" && (
          <p className="text-meta text-warning/90 mt-1">{t("market_sedanCapacityHint")}</p>
        )}
      </div>
      <div>
        <span className={labelClass}>{t("market_hotels")}</span>
        {!day.city ? (
          <p className="text-meta text-white/60 mt-1">{t("market_selectCityFirst")}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mt-1">
              {guideHotels.map((o) => {
                const selected = (day.hotel ?? "") === o.value;
                return (
                  <form
                    key={o.value}
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setGuideDayPlan(dayIndex, { hotel: o.value });
                    }}
                  >
                    <button type="submit" className={selected ? pillSelected : pillUnselected}>
                      {o.label}
                    </button>
                  </form>
                );
              })}
            </div>
            {selectedGuideHotelDetail && (
              <div className="mt-3 flex gap-3 items-start">
                <form
                  className="inline shrink-0"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setViewingHotel(selectedGuideHotelDetail);
                  }}
                >
                  <button
                    type="submit"
                    className="shrink-0 w-36 rounded-[var(--radius-sm)] border border-white/20 bg-slate-900/60 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-400"
                  >
                  <div className="relative aspect-[4/3] bg-slate-800">
                    <Image
                      src={selectedGuideHotelDetail.image}
                      alt={selectedGuideHotelDetail.label}
                      fill
                      className="object-cover"
                      sizes="144px"
                      unoptimized
                    />
                  </div>
                  <p className="p-2 text-smallall font-medium text-white truncate">{selectedGuideHotelDetail.label}</p>
                  <p className="px-2 pb-2 text-meta text-white/80 line-clamp-2">{selectedGuideHotelDetail.description}</p>
                </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
