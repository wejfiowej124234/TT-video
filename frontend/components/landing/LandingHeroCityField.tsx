"use client";

import { useEffect, useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useCatalogCityOptions } from "@/lib/catalogApi/useCatalogGeo";
import { TT_MARKETING_HOME_GLASS_FIELD_FOCUS, ttMarketingHomeFilterPillClasses } from "@/lib/marketingUi";

export interface LandingHeroCityFieldProps {
  country: string;
  cities: string[];
  setCities: (v: string[] | ((prev: string[]) => string[])) => void;
  citiesInvalid?: boolean;
  /** 未选国家时强化 placeholder 可读性 */
  countryMissing?: boolean;
  /** 校验错误文案区域 id（`aria-describedby`） */
  errorDescribedById?: string;
}

function parseCityDraft(raw: string): string[] {
  return raw
    .split(/[,，、]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function LandingHeroCityField({
  country,
  cities,
  setCities,
  citiesInvalid,
  countryMissing = false,
  errorDescribedById,
}: LandingHeroCityFieldProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const cityOptions = useCatalogCityOptions(country);
  const [cityDraft, setCityDraft] = useState(() => cities.join("、"));

  useEffect(() => {
    setCityDraft(cities.join("、"));
  }, [cities]);

  const applyCityDraft = (raw: string) => {
    setCities(parseCityDraft(raw));
  };

  return (
    <div className="space-y-3">
      <label id={labelId} htmlFor="landing-cities-input" className="block text-meta font-medium text-white/80">
        {t("landing_label_cities_multi")}
      </label>
      <input
        id="landing-cities-input"
        type="text"
        value={cityDraft}
        onChange={(e) => {
          const v = e.target.value;
          setCityDraft(v);
          applyCityDraft(v);
        }}
        onBlur={() => applyCityDraft(cityDraft)}
        disabled={!country}
        placeholder={country ? t("landing_cities_placeholder") : t("market_selectCountryFirst")}
        className={`w-full min-h-[44px] rounded-[var(--radius-xl)] border bg-white/20 backdrop-blur-sm px-3 py-2.5 text-small text-white ${TT_MARKETING_HOME_GLASS_FIELD_FOCUS} ${
          citiesInvalid
            ? "border-danger/60 ring-1 ring-danger/40"
            : countryMissing
              ? "border-ref-sun/35 placeholder:text-ref-sun placeholder:opacity-95 [placeholder-color:var(--ref-sun)]"
              : "border-white/30 placeholder:text-white/55"
        }`}
        aria-required="true"
        aria-invalid={citiesInvalid || undefined}
        aria-describedby={errorDescribedById}
        data-testid="landing-cities-input"
      />
      {country && cityOptions.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={t("landing_cities_quick_pick_aria")}>
          {cityOptions.map((c) => {
            const selected = cities.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  const next = selected
                    ? cities.filter((v) => v !== c.value)
                    : [...cities, c.value];
                  setCities(next);
                  setCityDraft(next.join("、"));
                }}
                className={ttMarketingHomeFilterPillClasses(selected)}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
