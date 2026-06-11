"use client";

import type { HotelDetail } from "@/lib/cityDetails";
import type { CityTransportType, CustomItineraryForm, GuideDayPlan } from "../types";
import { CITY_TRANSPORT_OPTIONS, CITY_TRANSPORT_DETAILS } from "../constants";
import { cityTransportCapacityWarningKey } from "../cityTransportQuote";
import { ItineraryMediaPreviewCard, ItineraryMediaPreviewRow } from "../ItineraryMediaPreviewCard";

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
                  setGuideDayPlan(dayIndex, { cityTransport: opt.value });
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
        {!day.city ? (
          <p className="mt-1 text-meta text-white/60">{t("market_selectCityFirst")}</p>
        ) : guideHotels.length === 0 ? (
          <p className="mt-1 text-meta text-white/60">{t("market_hotels_empty_for_city")}</p>
        ) : (
          <>
            <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("market_hotels")}>
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
                    <button type="submit" aria-pressed={selected} className={selected ? pillSelected : pillUnselected}>
                      {t(o.label)}
                    </button>
                  </form>
                );
              })}
            </div>
            {selectedGuideHotelDetail ? (
              <ItineraryMediaPreviewRow>
                <ItineraryMediaPreviewCard
                  imageSrc={selectedGuideHotelDetail.image}
                  title={t(selectedGuideHotelDetail.label)}
                  description={t(selectedGuideHotelDetail.description)}
                  previewAriaLabel={t("market_itinerary_media_preview_aria").replace(
                    "{{name}}",
                    t(selectedGuideHotelDetail.label),
                  )}
                  onPreview={() => setViewingHotel(selectedGuideHotelDetail)}
                />
              </ItineraryMediaPreviewRow>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
