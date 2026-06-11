"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import { getHotelDetails, getHotels } from "@/lib/cityDetails";
import type { HotelDetail } from "@/lib/cityDetails";
import type { CityTransportType, CustomItineraryForm, GuideDayPlan } from "../types";
import GuideDayCardAttractions from "./GuideDayCardAttractions";
import GuideDayCardCrossCityAndCity from "./GuideDayCardCrossCityAndCity";
import GuideDayCardFood from "./GuideDayCardFood";
import GuideDayCardTransportAndHotels from "./GuideDayCardTransportAndHotels";
import CustomItineraryCollapsibleDayShell from "../CustomItineraryCollapsibleDayShell";
import { isDayConfigured, touristDayCardSummary } from "../dayCardSummary";

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
  const collapsible = form.totalDays > 2;
  const stepLabel = t("market_itinerary_day_step")
    .replace("{{current}}", String(dayIndex + 1))
    .replace("{{total}}", String(form.totalDays));
  const guideDayAsTourist: import("../types").DayPlan = {
    city: day.city ?? "",
    attractions: day.attractions ? [day.attractions] : [],
    food: day.food ? [day.food] : [],
    hotel: day.hotel ?? "",
    cityTransport: day.cityTransport,
    transport: day.transport,
  };
  const guidePlans = form.guideDayPlans ?? [];
  const firstOpenIndex = guidePlans.findIndex((d) => !(d?.city ?? "").trim());
  const defaultOpen = dayIndex === 0 || dayIndex === firstOpenIndex || Boolean(day.city?.trim());

  return (
    <CustomItineraryCollapsibleDayShell
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      summary={touristDayCardSummary(guideDayAsTourist, dayIndex, t)}
      stepLabel={stepLabel}
    >
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
    </CustomItineraryCollapsibleDayShell>
  );
}
