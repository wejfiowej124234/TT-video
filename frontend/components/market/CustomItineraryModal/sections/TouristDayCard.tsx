"use client";

import type { AttractionDetail, FoodDetail, HotelDetail } from "@/lib/cityDetails";
import type { CustomItineraryForm, DayPlan } from "../types";
import CustomItineraryCollapsibleDayShell from "../CustomItineraryCollapsibleDayShell";
import { isDayConfigured, touristDayCardSummary } from "../dayCardSummary";
import TouristDayCardCrossCityAndCity from "./TouristDayCardCrossCityAndCity";
import TouristDayCardAttractions from "./TouristDayCardAttractions";
import TouristDayCardFood from "./TouristDayCardFood";
import TouristDayCardTransportAndHotels from "./TouristDayCardTransportAndHotels";

export interface TouristDayCardProps {
  day: DayPlan;
  dayIndex: number;
  form: CustomItineraryForm;
  setDayPlan: (dayIndex: number, patch: Partial<DayPlan>) => void;
  cities: { value: string; label: string }[];
  labelClass: string;
  pillSelected: string;
  pillUnselected: string;
  setViewingAttraction: (v: AttractionDetail | null) => void;
  setViewingFood: (v: FoodDetail | null) => void;
  setViewingVehicle: (v: import("../types").CityTransportType | null) => void;
  setViewingHotel: (v: HotelDetail | null) => void;
  t: (key: string) => string;
}

export default function TouristDayCard({
  day,
  dayIndex,
  form,
  setDayPlan,
  cities,
  labelClass,
  pillSelected,
  pillUnselected,
  setViewingAttraction,
  setViewingFood,
  setViewingVehicle,
  setViewingHotel,
  t,
}: TouristDayCardProps) {
  const collapsible = form.totalDays > 2;
  const stepLabel = t("market_itinerary_day_step")
    .replace("{{current}}", String(dayIndex + 1))
    .replace("{{total}}", String(form.totalDays));
  const firstOpenIndex = form.dayPlans.findIndex((d) => !isDayConfigured(d));
  const defaultOpen = dayIndex === 0 || dayIndex === firstOpenIndex || isDayConfigured(day);

  return (
    <CustomItineraryCollapsibleDayShell
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      summary={touristDayCardSummary(day, dayIndex, t)}
      stepLabel={stepLabel}
    >
      <TouristDayCardCrossCityAndCity
        day={day}
        dayIndex={dayIndex}
        form={form}
        setDayPlan={setDayPlan}
        cities={cities}
        labelClass={labelClass}
        pillSelected={pillSelected}
        pillUnselected={pillUnselected}
        t={t}
      />
      {day.city ? (
        <>
          <TouristDayCardAttractions
            day={day}
            dayIndex={dayIndex}
            countryNameZh={form.country}
            setDayPlan={setDayPlan}
            setViewingAttraction={setViewingAttraction}
            labelClass={labelClass}
            pillSelected={pillSelected}
            pillUnselected={pillUnselected}
            t={t}
          />
          <TouristDayCardFood
            day={day}
            dayIndex={dayIndex}
            countryNameZh={form.country}
            setDayPlan={setDayPlan}
            setViewingFood={setViewingFood}
            labelClass={labelClass}
            pillSelected={pillSelected}
            pillUnselected={pillUnselected}
            t={t}
          />
          <TouristDayCardTransportAndHotels
            day={day}
            dayIndex={dayIndex}
            form={form}
            setDayPlan={setDayPlan}
            setViewingVehicle={setViewingVehicle}
            setViewingHotel={setViewingHotel}
            labelClass={labelClass}
            pillSelected={pillSelected}
            pillUnselected={pillUnselected}
            t={t}
          />
        </>
      ) : null}
    </CustomItineraryCollapsibleDayShell>
  );
}
