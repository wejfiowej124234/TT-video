"use client";

import { getHotelDetails, getHotels } from "@/lib/cityDetails";
import type { HotelDetail } from "@/lib/cityDetails";
import type { CityTransportType, CustomItineraryForm, GuideDayPlan } from "../types";
import GuideDayCardAttractions from "./GuideDayCardAttractions";
import GuideDayCardCrossCityAndCity from "./GuideDayCardCrossCityAndCity";
import GuideDayCardFood from "./GuideDayCardFood";
import GuideDayCardTransportAndHotels from "./GuideDayCardTransportAndHotels";

export interface GuideDayCardProps {
  day: GuideDayPlan;
  dayIndex: number;
  form: CustomItineraryForm;
  prevCity: string;
  setGuideDayPlan: (dayIndex: number, patch: Partial<GuideDayPlan>) => void;
  cities: { value: string; label: string }[];
  labelClass: string;
  inputClass: string;
  pillSelected: string;
  pillUnselected: string;
  setViewingGuideImage: (v: { label: string; url: string } | null) => void;
  setViewingVehicle: (v: CityTransportType | null) => void;
  setViewingHotel: (v: HotelDetail | null) => void;
  t: (key: string) => string;
}

export default function GuideDayCard({
  day,
  dayIndex,
  form,
  setGuideDayPlan,
  cities: guideCities,
  labelClass,
  inputClass,
  pillSelected,
  pillUnselected,
  setViewingGuideImage,
  setViewingVehicle,
  setViewingHotel,
  t,
  prevCity,
}: GuideDayCardProps) {
  const guideHotelDetails = getHotelDetails(day.city ?? "");
  const guideHotels = getHotels(day.city ?? "");
  const selectedGuideHotelDetail = (day.hotel ?? "") ? (guideHotelDetails.find((h) => h.value === day.hotel) ?? null) : null;

  return (
    <div className="rounded-[var(--radius-md)] border border-white/25 bg-white/5 p-4 space-y-3">
      <h3 className="text-small font-semibold text-white drop-shadow-market-pill">
        {t("market_dayN").replace("{n}", String(dayIndex + 1))}
      </h3>
      <GuideDayCardCrossCityAndCity
        day={day}
        dayIndex={dayIndex}
        prevCity={prevCity}
        setGuideDayPlan={setGuideDayPlan}
        cities={guideCities}
        labelClass={labelClass}
        pillSelected={pillSelected}
        pillUnselected={pillUnselected}
        t={t}
      />
      <GuideDayCardAttractions
        day={day}
        dayIndex={dayIndex}
        setGuideDayPlan={setGuideDayPlan}
        setViewingGuideImage={setViewingGuideImage}
        labelClass={labelClass}
        inputClass={inputClass}
        t={t}
      />
      <GuideDayCardFood
        day={day}
        dayIndex={dayIndex}
        setGuideDayPlan={setGuideDayPlan}
        setViewingGuideImage={setViewingGuideImage}
        labelClass={labelClass}
        inputClass={inputClass}
        t={t}
      />
      <GuideDayCardTransportAndHotels
        day={day}
        dayIndex={dayIndex}
        form={form}
        setGuideDayPlan={setGuideDayPlan}
        setViewingVehicle={setViewingVehicle}
        setViewingHotel={setViewingHotel}
        guideHotels={guideHotels}
        selectedGuideHotelDetail={selectedGuideHotelDetail}
        labelClass={labelClass}
        pillSelected={pillSelected}
        pillUnselected={pillUnselected}
        t={t}
      />
    </div>
  );
}
