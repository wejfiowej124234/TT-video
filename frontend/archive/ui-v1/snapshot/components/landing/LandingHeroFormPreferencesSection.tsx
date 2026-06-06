"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { ATTRACTION_TYPE_OPTIONS, STANDARD_OPTIONS, HOTEL_OPTIONS } from "./constants";

export interface LandingHeroFormPreferencesSectionProps {
  attractionTypes: string[];
  setAttractionTypes: (v: string[] | ((prev: string[]) => string[])) => void;
  diningStandards: string[];
  setDiningStandards: (v: string[] | ((prev: string[]) => string[])) => void;
  hotelStandards: string[];
  setHotelStandards: (v: string[] | ((prev: string[]) => string[])) => void;
}

export default function LandingHeroFormPreferencesSection({
  attractionTypes,
  setAttractionTypes,
  diningStandards,
  setDiningStandards,
  hotelStandards,
  setHotelStandards,
}: LandingHeroFormPreferencesSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-8 pt-6 border-t border-white/15 space-y-6">
      <h3 className="text-small font-semibold text-white/95">{t("landing_section_preferences")}</h3>
      <div className="space-y-2">
        <span className="block text-meta text-white/70">{t("landing_label_attraction_types")}</span>
        <div className="flex flex-wrap gap-2">
          {ATTRACTION_TYPE_OPTIONS.map((a) => {
            const selected = attractionTypes.includes(a.value);
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => {
                  setAttractionTypes((prev) => (selected ? prev.filter((v) => v !== a.value) : [...prev, a.value]));
                }}
                className={`rounded-full px-3 py-1.5 text-meta font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                  selected ? "bg-white/30 border-white/40 text-white" : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
                }`}
              >
                {t(a.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <span className="block text-meta text-white/70">{t("landing_label_dining")}</span>
          <div className="flex flex-wrap gap-2">
            {STANDARD_OPTIONS.map((s) => {
              const selected = diningStandards.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setDiningStandards((prev) => (selected ? prev.filter((v) => v !== s.value) : [...prev, s.value]));
                  }}
                  className={`rounded-full px-3 py-1.5 text-meta font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    selected ? "bg-white/30 border-white/40 text-white" : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
                  }`}
                >
                  {t(s.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <span className="block text-meta text-white/70">{t("landing_label_hotel")}</span>
          <div className="flex flex-wrap gap-2">
            {HOTEL_OPTIONS.map((s) => {
              const selected = hotelStandards.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setHotelStandards((prev) => (selected ? prev.filter((v) => v !== s.value) : [...prev, s.value]));
                  }}
                  className={`rounded-full px-3 py-1.5 text-meta font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    selected ? "bg-white/30 border-white/40 text-white" : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
                  }`}
                >
                  {t(s.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
