"use client";

import type { ReactNode } from "react";
import { useId, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { COUNTRY_OPTIONS, CITIES_BY_COUNTRY, LANGUAGES_BY_COUNTRY, LANGUAGE_OPTIONS, SERVICE_TYPE_OPTIONS } from "@/lib/geoOptions";
import { countMarketAdvancedFilterSelections } from "@/lib/marketPageQuery";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const p = TT_MARKETING_MARKET_DARK_PATH;

function FilterChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`${p.marketFilterChevron} ${expanded ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FilterFieldRow({
  label,
  labelClass,
  children,
}: {
  label: string;
  labelClass: string;
  children: ReactNode;
}) {
  return (
    <div className={p.filterRowGrid}>
      <span className={labelClass}>{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** P29 顶部筛选条：国家+城市筛订单，语言+服务筛向导；glass 为 28 玻璃态 */
export default function StickyFilterBar({
  country,
  city,
  languages,
  serviceTypes,
  tripDaysFilter = null,
  onTripDaysFilterClear,
  filterExpanded,
  onFilterExpandedChange,
  onCountryChange,
  onCityChange,
  onLanguagesChange,
  onServiceTypesChange,
  glass,
}: {
  country: string;
  city: string;
  languages: string[];
  serviceTypes: string[];
  tripDaysFilter?: number | null;
  onTripDaysFilterClear?: () => void;
  filterExpanded: boolean;
  onFilterExpandedChange: (open: boolean) => void;
  onCountryChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onLanguagesChange: (values: string[]) => void;
  onServiceTypesChange: (values: string[]) => void;
  glass?: boolean;
}) {
  const { t } = useTranslation();
  const advancedFilterPanelId = useId();
  const advancedCountId = useId();
  const marketSearchHintId = useId();
  const cities = country ? (CITIES_BY_COUNTRY[country] ?? []) : [];
  const languageOptions = country ? (LANGUAGES_BY_COUNTRY[country] ?? []) : LANGUAGE_OPTIONS;

  const tripDaysChipVisible = tripDaysFilter != null && onTripDaysFilterClear;

  const advancedSelectionCount = useMemo(
    () =>
      countMarketAdvancedFilterSelections({
        city,
        languages,
        serviceTypes,
        tripDaysFilter: tripDaysChipVisible ? null : tripDaysFilter,
      }),
    [city, languages, serviceTypes, tripDaysChipVisible, tripDaysFilter],
  );

  const barClass = glass
    ? p.filterBarGlass
    : "sticky top-0 z-10 border-b border-ink-200 bg-bg-console/95 backdrop-blur-sm py-4 px-4";

  const pillBase = glass
    ? `${touchTargetLink44Classes} ${p.filterChipTextGlass} rounded-full border px-2.5 py-1 transition-colors ${p.filterChipFocusGlass}`
    : `${touchTargetLink44Classes} rounded-full px-3 py-1.5 text-meta font-medium border border-ink-200 transition-colors`;

  const pillSelected = glass ? p.filterChipActiveGlass : "bg-travel-500/20 border-travel-500/50 text-ink-900";
  const pillUnselected = glass ? p.filterChipIdleGlass : "bg-bg-soft border-ink-200 text-ink-600 hover:bg-bg-console";

  const labelClass = glass ? p.filterRowLabelGlass : "text-meta font-medium text-ink-600";
  const sectionClass = glass ? p.filterSectionGlass : "text-meta font-medium text-ink-500";
  const hintClass = glass ? p.filterHintGlass : "text-meta text-ink-500";
  const placeholderClass = glass ? p.filterPlaceholderGlass : "text-meta text-ink-500";

  const moreToggleClass = glass
    ? `${touchTargetLink44Classes} ${p.marketFilterMoreToggle} ${p.filterChipFocusGlass}`
    : `${touchTargetLink44Classes} text-meta text-travel-500 hover:underline`;

  const toggleService = (value: string) => {
    const next = serviceTypes.includes(value)
      ? serviceTypes.filter((s) => s !== value)
      : [...serviceTypes, value];
    onServiceTypesChange(next);
  };

  return (
    <div className={barClass} role="group" aria-label={t("filter_aria_market")}>
      <div className="flex flex-col gap-3">
        <div role="search" aria-label={t("market_filter_search_label")} className={p.marketFilterSearchWrap}>
          <input
            type="search"
            data-tt-market-filter-search="1"
            placeholder={t("market_filter_search_placeholder")}
            aria-label={t("market_filter_search_label")}
            aria-describedby={marketSearchHintId}
            aria-controls={advancedFilterPanelId}
            onFocus={() => onFilterExpandedChange(true)}
            className={p.marketFilterSearchInput}
          />
          <p id={marketSearchHintId} className={p.marketFilterSearchHint}>
            {t("market_filter_search_hint")}
          </p>
        </div>

        <div className="flex flex-col gap-2.5" role="group" aria-label={t("filter_aria_orders")}>
          {tripDaysChipVisible ? (
            <div className="flex flex-wrap items-center gap-2" role="status" aria-live="polite">
              <span className={`${pillBase} ${pillSelected}`}>
                {t("market_trip_days_filter_chip").replace("{{n}}", String(tripDaysFilter))}
              </span>
              <button
                type="button"
                onClick={onTripDaysFilterClear}
                className={`${touchTargetLink44Classes} text-small font-medium text-ref-sun/90 underline decoration-ref-sun/40 underline-offset-4 hover:text-ref-sun ${p.filterChipFocusGlass}`}
              >
                {t("market_trip_days_filter_clear")}
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className={sectionClass}>{t("filter_section_orders")}</span>
            <button
              type="button"
              aria-expanded={filterExpanded}
              aria-controls={advancedFilterPanelId}
              aria-describedby={advancedSelectionCount > 0 ? advancedCountId : undefined}
              onClick={() => onFilterExpandedChange(!filterExpanded)}
              className={moreToggleClass}
            >
              <span>{filterExpanded ? t("filter_collapse") : t("filter_expand")}</span>
              {advancedSelectionCount > 0 ? (
                <span id={advancedCountId} className={p.marketFilterAdvancedBadge} aria-hidden>
                  {advancedSelectionCount}
                </span>
              ) : null}
              <FilterChevron expanded={filterExpanded} />
            </button>
          </div>

          <FilterFieldRow label={t("filter_label_country")} labelClass={labelClass}>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("filter_label_country")}>
              <button
                type="button"
                aria-pressed={!country}
                onClick={() => {
                  onCountryChange("");
                  onCityChange("");
                  onLanguagesChange([]);
                }}
                className={`${pillBase} ${!country ? pillSelected : pillUnselected}`}
              >
                {t("filter_country_all")}
              </button>
              {COUNTRY_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={country === c.value}
                  onClick={() => {
                    if (country === c.value) {
                      onCountryChange("");
                      onCityChange("");
                      onLanguagesChange([]);
                    } else {
                      onCountryChange(c.value);
                      onCityChange("");
                      onLanguagesChange([]);
                    }
                  }}
                  className={`${pillBase} ${country === c.value ? pillSelected : pillUnselected}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </FilterFieldRow>
        </div>

        {filterExpanded ? (
          <div id={advancedFilterPanelId} className="flex flex-col gap-2.5">
            <FilterFieldRow label={t("filter_label_city")} labelClass={labelClass}>
              {!country ? (
                <span className={placeholderClass}>{t("filter_selectCountryFirst")}</span>
              ) : (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("filter_label_city")}>
                  {cities.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      aria-pressed={city === c.value}
                      onClick={() => onCityChange(city === c.value ? "" : c.value)}
                      className={`${pillBase} ${city === c.value ? pillSelected : pillUnselected}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </FilterFieldRow>

            <div
              className={`${p.filterGuidePanelGlass} border-t ${glass ? p.filterBarGlassDivider : "border-ink-200"} pt-3`}
              role="group"
              aria-label={t("filter_aria_guides")}
            >
              <p className={p.filterGuideSectionTitleGlass}>{t("filter_section_guides")}</p>

              <FilterFieldRow label={t("filter_label_lang")} labelClass={labelClass}>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("filter_label_lang")}>
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={languages.includes(opt.value)}
                      onClick={() => {
                        const next = languages.includes(opt.value)
                          ? languages.filter((l) => l !== opt.value)
                          : [...languages, opt.value];
                        onLanguagesChange(next);
                      }}
                      className={`${pillBase} ${languages.includes(opt.value) ? pillSelected : pillUnselected}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterFieldRow>

              <FilterFieldRow label={t("filter_label_service")} labelClass={labelClass}>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("filter_label_service")}>
                  {SERVICE_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={serviceTypes.includes(opt.value)}
                      onClick={() => toggleService(opt.value)}
                      className={`${pillBase} ${serviceTypes.includes(opt.value) ? pillSelected : pillUnselected}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterFieldRow>
            </div>

            <p className={hintClass}>{t("filter_hint")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
