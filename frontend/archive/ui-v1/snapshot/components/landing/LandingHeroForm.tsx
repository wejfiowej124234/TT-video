"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { landingHeroFormAlertText } from "@/lib/landingHeroFormAlert";
import type { LandingHeroFormProps } from "./landingHeroFormTypes";
import LandingHeroFormHeroIntro from "./LandingHeroFormHeroIntro";
import LandingHeroFormLocationSection from "./LandingHeroFormLocationSection";
import LandingHeroFormDateTripSubmitRow from "./LandingHeroFormDateTripSubmitRow";
import LandingHeroFormPreferencesSection from "./LandingHeroFormPreferencesSection";
import { useLandingHeroFormDateRangePicker } from "./useLandingHeroFormDateRangePicker";
import {
  TT_MARKETING_HOME_FORM_INNER_GLOW,
  TT_MARKETING_HOME_FORM_PANEL,
  TT_MARKETING_HOME_HERO_CARD_FRAME,
  TT_MARKETING_HOME_HERO_GRID,
  TT_MARKETING_HOME_HERO_SECTION,
} from "@/lib/marketingUi";

export type { LandingHeroFormProps } from "./landingHeroFormTypes";

export default function LandingHeroForm({
  country,
  setCountry,
  cities,
  setCities,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  days,
  attractionTypes,
  setAttractionTypes,
  diningStandards,
  setDiningStandards,
  hotelStandards,
  setHotelStandards,
  budget,
  setBudget,
  partySize,
  setPartySize,
  numRooms,
  setNumRooms,
  submitting,
  validationErrorKey,
  submitError,
  handleSubmit,
}: LandingHeroFormProps) {
  const { t } = useTranslation();
  const dateRange = useLandingHeroFormDateRangePicker({
    startDate,
    endDate,
    setStartDate,
    setEndDate,
  });
  const formAlertText = landingHeroFormAlertText(validationErrorKey, submitError, t);

  return (
    <section
      id="form"
      className={TT_MARKETING_HOME_HERO_SECTION}
      data-tt-marketing-home-hero="1"
      data-tt-marketing-home-layout="centered-card"
    >
      <div className={TT_MARKETING_HOME_HERO_GRID}>
        <div className={TT_MARKETING_HOME_HERO_CARD_FRAME}>
          <div className={TT_MARKETING_HOME_FORM_PANEL}>
            <div className={TT_MARKETING_HOME_FORM_INNER_GLOW} aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-slate-950/20" aria-hidden />
            <div className="relative p-6 sm:p-8 lg:p-10">
              <LandingHeroFormHeroIntro />
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-6"
                id="landing-hero-form"
                aria-label={t("landing_cta_create")}
              >
                <LandingHeroFormLocationSection
                  country={country}
                  setCountry={setCountry}
                  cities={cities}
                  setCities={setCities}
                />
                <LandingHeroFormDateTripSubmitRow
                  days={days}
                  startDate={startDate}
                  endDate={endDate}
                  partySize={partySize}
                  setPartySize={setPartySize}
                  numRooms={numRooms}
                  setNumRooms={setNumRooms}
                  budget={budget}
                  setBudget={setBudget}
                  submitting={submitting}
                  dateRange={dateRange}
                />
                <LandingHeroFormPreferencesSection
                  attractionTypes={attractionTypes}
                  setAttractionTypes={setAttractionTypes}
                  diningStandards={diningStandards}
                  setDiningStandards={setDiningStandards}
                  hotelStandards={hotelStandards}
                  setHotelStandards={setHotelStandards}
                />
                {formAlertText ? (
                  <p className="mt-3 text-small text-danger font-medium" role="alert">
                    {formAlertText}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
