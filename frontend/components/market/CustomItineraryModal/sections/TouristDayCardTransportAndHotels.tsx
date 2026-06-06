"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import Image from "next/image";
import { getHotelDetails, getHotels } from "@/lib/cityDetails";
import type { HotelDetail } from "@/lib/cityDetails";
import type { CityTransportType, CustomItineraryForm, DayPlan } from "../types";
import { CITY_TRANSPORT_OPTIONS, CITY_TRANSPORT_DETAILS, SEDAN_CAPACITY } from "../constants";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export interface TouristDayCardTransportAndHotelsProps {
  day: DayPlan;
  dayIndex: number;
  form: CustomItineraryForm;
  setDayPlan: (dayIndex: number, patch: Partial<DayPlan>) => void;
  setViewingVehicle: (v: CityTransportType | null) => void;
  setViewingHotel: (v: HotelDetail | null) => void;
  labelClass: string;
  pillSelected: string;
  pillUnselected: string;
  t: (key: string) => string;
}

export default function TouristDayCardTransportAndHotels({
  day,
  dayIndex,
  form,
  setDayPlan,
  setViewingVehicle,
  setViewingHotel,
  labelClass,
  pillSelected,
  pillUnselected,
  t,
}: TouristDayCardTransportAndHotelsProps) {
  const hotelDetails = getHotelDetails(day.city);
  const hotels = getHotels(day.city);
  const selectedHotelDetail = day.hotel ? hotelDetails.find((h) => h.value === day.hotel) : null;

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
                  setDayPlan(dayIndex, { cityTransport: opt.value });
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
                className="shrink-0 w-36 rounded-[var(--radius-sm)] border border-ref-sun/16 bg-ink-950/60 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                <div className="relative aspect-[4/3] bg-ink-800">
                  <Image
                    src={communityMediaAbsoluteUrlForRender(CITY_TRANSPORT_DETAILS[day.cityTransport!].image)}
                    alt={t(CITY_TRANSPORT_OPTIONS.find((o) => o.value === day.cityTransport)!.labelKey)}
                    fill
                    className="object-cover"
                    sizes="144px"
                    unoptimized={communityMediaNextImageUnoptimized(
                      communityMediaAbsoluteUrlForRender(CITY_TRANSPORT_DETAILS[day.cityTransport!].image)
                    )}
                  />
                </div>
                <p className="p-3 text-small font-medium text-white">
                  {t(CITY_TRANSPORT_OPTIONS.find((o) => o.value === day.cityTransport)!.labelKey)}
                </p>
                <p className="px-3 pb-3 text-meta text-white/80 line-clamp-2">
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
        <div className="flex flex-wrap gap-2 mt-1">
          {hotels.map((o) => {
            const selected = day.hotel === o.value;
            return (
              <form
                key={o.value}
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  setDayPlan(dayIndex, { hotel: o.value });
                }}
              >
                <button type="submit" className={selected ? pillSelected : pillUnselected}>
                  {o.label}
                </button>
              </form>
            );
          })}
        </div>
        {selectedHotelDetail && (
          <div className="mt-3 flex gap-3 items-start">
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                setViewingHotel(selectedHotelDetail);
              }}
            >
              <button
                type="submit"
                className="shrink-0 w-36 rounded-[var(--radius-sm)] border border-ref-sun/16 bg-ink-950/60 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                <div className="relative aspect-[4/3] bg-ink-800">
                  <Image
                    src={communityMediaAbsoluteUrlForRender(selectedHotelDetail.image)}
                    alt={selectedHotelDetail.label}
                    fill
                    className="object-cover"
                    sizes="144px"
                    unoptimized={communityMediaNextImageUnoptimized(
                      communityMediaAbsoluteUrlForRender(selectedHotelDetail.image)
                    )}
                  />
                </div>
                <p className="p-3 text-small font-medium text-white truncate">{selectedHotelDetail.label}</p>
                <p className="px-3 pb-3 text-meta text-white/80 line-clamp-2">{selectedHotelDetail.description}</p>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
