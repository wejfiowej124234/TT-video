"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import Image from "next/image";
import { getAttractionDetails, getFoodDetails, getHotelDetails, getHotels } from "@/lib/cityDetails";
import type { AttractionDetail, FoodDetail, HotelDetail } from "@/lib/cityDetails";
import type { CustomItineraryForm, DayPlan } from "../types";
import { TRANSPORT_OPTIONS, CITY_TRANSPORT_OPTIONS, CITY_TRANSPORT_DETAILS, SEDAN_CAPACITY } from "../constants";

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
  const attractionDetails = getAttractionDetails(day.city);
  const foodDetails = getFoodDetails(day.city);
  const hotelDetails = getHotelDetails(day.city);
  const hotels = getHotels(day.city);
  const selectedHotelDetail = day.hotel ? hotelDetails.find((h) => h.value === day.hotel) : null;
  const selectedAttractionsInOrder = day.attractions
    .map((v) => attractionDetails.find((a) => a.value === v))
    .filter((a): a is AttractionDetail => a != null);
  const selectedFoodInOrder = day.food
    .map((v) => foodDetails.find((f) => f.value === v))
    .filter((f): f is FoodDetail => f != null);

  return (
    <div className={CIM.customItineraryPanelDay}>
      <h3 className="text-small font-semibold text-white drop-shadow-market-pill">
        {t("market_dayN").replace("{n}", String(dayIndex + 1))}
      </h3>
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
      {day.city && (
        <>
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
                      <div className="relative aspect-[4/3] bg-slate-800">
                        <Image src={a.image} alt={a.label} fill className="object-cover" sizes="144px" unoptimized />
                      </div>
                      <p className="p-2 text-smallall font-medium text-white truncate">{a.label}</p>
                      <p className="px-2 pb-2 text-meta text-white/80 line-clamp-2">{a.description}</p>
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
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
                      <div className="relative aspect-[4/3] bg-slate-800">
                        <Image src={f.image} alt={f.label} fill className="object-cover" sizes="144px" unoptimized />
                      </div>
                      <p className="p-2 text-smallall font-medium text-white truncate">{f.label}</p>
                      <p className="px-2 pb-2 text-meta text-white/80 line-clamp-2">{f.description}</p>
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
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
                    <div className="relative aspect-[4/3] bg-slate-800">
                      <Image
                        src={selectedHotelDetail.image}
                        alt={selectedHotelDetail.label}
                        fill
                        className="object-cover"
                        sizes="144px"
                        unoptimized
                      />
                    </div>
                    <p className="p-2 text-smallall font-medium text-white truncate">{selectedHotelDetail.label}</p>
                    <p className="px-2 pb-2 text-meta text-white/80 line-clamp-2">{selectedHotelDetail.description}</p>
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
