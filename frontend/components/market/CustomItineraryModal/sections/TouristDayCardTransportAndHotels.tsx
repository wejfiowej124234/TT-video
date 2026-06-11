"use client";

import { getHotelDetails, getHotels } from "@/lib/cityDetails";
import type { HotelDetail } from "@/lib/cityDetails";
import type { CityTransportType, CustomItineraryForm, DayPlan } from "../types";
import { CITY_TRANSPORT_OPTIONS, CITY_TRANSPORT_DETAILS } from "../constants";
import { cityTransportCapacityWarningKey } from "../cityTransportQuote";
import { ItineraryMediaPreviewCard, ItineraryMediaPreviewRow } from "../ItineraryMediaPreviewCard";

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
  const transportOpt = day.cityTransport
    ? CITY_TRANSPORT_OPTIONS.find((o) => o.value === day.cityTransport)
    : null;

  return (
    <>
      <div>
        <span className={labelClass}>{t("market_transportInCity")}</span>
        <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("market_transportInCity")}>
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
                <button type="submit" aria-pressed={selected} className={selected ? pillSelected : pillUnselected}>
                  {t(opt.labelKey)}
                </button>
              </form>
            );
          })}
        </div>
        {day.cityTransport && transportOpt ? (
          <ItineraryMediaPreviewRow>
            <ItineraryMediaPreviewCard
              imageSrc={CITY_TRANSPORT_DETAILS[day.cityTransport].image}
              title={t(transportOpt.labelKey)}
              description={t(CITY_TRANSPORT_DETAILS[day.cityTransport].descriptionKey)}
              previewAriaLabel={t("market_itinerary_media_preview_aria").replace("{{name}}", t(transportOpt.labelKey))}
              onPreview={() => setViewingVehicle(day.cityTransport!)}
            />
          </ItineraryMediaPreviewRow>
        ) : null}
        {(() => {
          const warnKey = cityTransportCapacityWarningKey(form.headcount, day.cityTransport);
          return warnKey ? (
            <p className="mt-1 text-meta text-warning/90">{t(warnKey)}</p>
          ) : null;
        })()}
      </div>
      <div>
        <span className={labelClass}>{t("market_hotels")}</span>
        {hotels.length === 0 ? (
          <p className="mt-1 text-meta text-white/60">{t("market_hotels_empty_for_city")}</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("market_hotels")}>
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
                  <button type="submit" aria-pressed={selected} className={selected ? pillSelected : pillUnselected}>
                    {t(o.label)}
                  </button>
                </form>
              );
            })}
          </div>
        )}
        {selectedHotelDetail ? (
          <ItineraryMediaPreviewRow>
            <ItineraryMediaPreviewCard
              imageSrc={selectedHotelDetail.image}
              title={t(selectedHotelDetail.label)}
              description={t(selectedHotelDetail.description)}
              previewAriaLabel={t("market_itinerary_media_preview_aria").replace(
                "{{name}}",
                t(selectedHotelDetail.label),
              )}
              onPreview={() => setViewingHotel(selectedHotelDetail)}
            />
          </ItineraryMediaPreviewRow>
        ) : null}
      </div>
    </>
  );
}
