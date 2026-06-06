"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { COUNTRY_OPTIONS, CITIES_BY_COUNTRY } from "./constants";

export interface LandingHeroFormLocationSectionProps {
  country: string;
  setCountry: (v: string) => void;
  cities: string[];
  setCities: (v: string[] | ((prev: string[]) => string[])) => void;
}

export default function LandingHeroFormLocationSection({
  country,
  setCountry,
  cities,
  setCities,
}: LandingHeroFormLocationSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-3">
        <span className="block text-meta font-medium text-white/80">{t("landing_label_country_single")}</span>
        <div className="flex flex-wrap gap-2">
          {COUNTRY_OPTIONS.map((c) => {
            const selected = country === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCountry(c.value);
                  setCities([]);
                }}
                className={`rounded-full px-3 py-1.5 text-meta font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                  selected ? "bg-white/30 border-white/40 text-white" : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-3">
        <span className="block text-meta font-medium text-white/80">{t("landing_label_cities_multi")}</span>
        {!country ? (
          <span className="block rounded-[var(--radius-xl)] border border-white/30 bg-white/10 px-3 py-2.5 text-meta text-white/60">
            {t("market_selectCountryFirst")}
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(CITIES_BY_COUNTRY[country] ?? []).map((c) => {
              const selected = cities.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setCities((prev) => (selected ? prev.filter((v) => v !== c.value) : [...prev, c.value]));
                  }}
                  className={`rounded-full px-3 py-1.5 text-meta font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    selected ? "bg-white/30 border-white/40 text-white" : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
