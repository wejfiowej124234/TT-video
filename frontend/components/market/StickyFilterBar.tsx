"use client";

import { useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { COUNTRY_OPTIONS, CITIES_BY_COUNTRY, LANGUAGES_BY_COUNTRY, SERVICE_TYPE_OPTIONS } from "@/lib/geoOptions";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreClasses,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

/** P29 顶部筛选条：国家+城市筛订单，语言+服务筛向导；glass 为 28 玻璃态 */
export default function StickyFilterBar({
  country,
  city,
  languages,
  serviceTypes,
  onCountryChange,
  onCityChange,
  onLanguagesChange,
  onServiceTypesChange,
  glass,
}: {
  country: string;
  city: string;
  /** 多选：按国家展示的语言选项 */
  languages: string[];
  /** 多选：向导服务、陪玩服务、摄影服务、司机服务 */
  serviceTypes: string[];
  onCountryChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onLanguagesChange: (values: string[]) => void;
  onServiceTypesChange: (values: string[]) => void;
  glass?: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const advancedFilterNoteId = useId();
  const cities = country ? (CITIES_BY_COUNTRY[country] ?? []) : [];
  const languageOptions = country ? (LANGUAGES_BY_COUNTRY[country] ?? []) : [];
  const barClass = glass
    ? "sticky top-0 z-10 border-b border-white/15 py-4 px-4"
    : "sticky top-0 z-10 border-b border-ink-200 bg-bg-console/95 backdrop-blur-sm py-4 px-4";
  const pillBase = glass
    ? `${touchTargetLink44Classes} rounded-full px-3 py-1.5 text-meta font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50`
    : `${touchTargetLink44Classes} rounded-full px-3 py-1.5 text-meta font-medium border border-ink-200 transition-colors ${travelFocusRingCoreClasses}`;
  const pillSelected = glass
    ? "bg-ref-cyan/25 border-ref-cyan/45 text-white ring-1 ring-ref-coral/25 shadow-[0_0_16px_-4px_rgba(35,206,217,0.25)]"
    : "bg-travel-500/20 border-travel-500/50 text-ink-900";
  const pillUnselected = glass
    ? "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
    : "bg-bg-soft border-ink-200 text-ink-600 hover:bg-bg-console";
  const labelClass = glass ? "text-meta font-medium text-white" : "text-meta font-medium text-ink-600";
  const sectionClass = glass ? "text-meta font-medium text-white/80" : "text-meta font-medium text-ink-500";

  const toggleService = (value: string) => {
    const next = serviceTypes.includes(value)
      ? serviceTypes.filter((s) => s !== value)
      : [...serviceTypes, value];
    onServiceTypesChange(next);
  };

  return (
    <div className={barClass} role="group" aria-label={t("filter_aria_market")}>
      <div className="flex flex-col gap-4">
        {/* 筛选订单：国家 + 城市 */}
        <div className="flex flex-col gap-2" role="group" aria-label={t("filter_aria_orders")}>
          <span className={sectionClass}>{t("filter_section_orders")}</span>
          <div className="flex flex-wrap items-center gap-3">
            <span className={labelClass}>{t("filter_label_country")}</span>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_OPTIONS.map((c) => (
                <form
                  key={c.value}
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
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
                >
                  <button
                    type="submit"
                    className={`${pillBase} ${country === c.value ? pillSelected : pillUnselected}`}
                  >
                    {c.label}
                  </button>
                </form>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={labelClass}>{t("filter_label_city")}</span>
            {!country ? (
              <span className={glass ? "text-meta text-white/60" : "text-meta text-ink-500"}>{t("filter_selectCountryFirst")}</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <form
                    key={c.value}
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onCityChange(city === c.value ? "" : c.value);
                    }}
                  >
                    <button
                      type="submit"
                      className={`${pillBase} ${city === c.value ? pillSelected : pillUnselected}`}
                    >
                      {c.label}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* 筛选向导：语言（按国家动态）+ 服务（多选） */}
        <div className={`flex flex-col gap-2 pt-2 border-t ${glass ? "border-white/15" : "border-ink-200"}`} role="group" aria-label={t("filter_aria_guides")}>
          <span className={sectionClass}>{t("filter_section_guides")}</span>
          <div className="flex flex-wrap items-center gap-3">
            <span className={labelClass}>{t("filter_label_lang")}</span>
            {!country ? (
              <span className={glass ? "text-meta text-white/60" : "text-meta text-ink-500"}>{t("filter_selectCountryFirst")}</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((opt) => (
                  <form
                    key={opt.value}
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const next = languages.includes(opt.value)
                        ? languages.filter((l) => l !== opt.value)
                        : [...languages, opt.value];
                      onLanguagesChange(next);
                    }}
                  >
                    <button
                      type="submit"
                      className={`${pillBase} ${languages.includes(opt.value) ? pillSelected : pillUnselected}`}
                    >
                      {opt.label}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={labelClass}>{t("filter_label_service")}</span>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPE_OPTIONS.map((opt) => (
                <form
                  key={opt.value}
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    toggleService(opt.value);
                  }}
                >
                  <button
                    type="submit"
                    className={`${pillBase} ${serviceTypes.includes(opt.value) ? pillSelected : pillUnselected}`}
                  >
                    {opt.label}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
        <div className={`flex flex-wrap items-center gap-3 pt-1 border-t ${glass ? "border-white/15" : "border-ink-200"}`}>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              setExpanded((x) => !x);
            }}
          >
            <button
              type="submit"
              aria-expanded={expanded}
              aria-controls={advancedFilterNoteId}
              className={`${touchTargetLink44Classes} ${glass ? "text-meta font-medium text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900" : `text-meta text-travel-500 hover:underline ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}`}
            >
              {expanded ? t("filter_collapse") : t("filter_expand")}
            </button>
          </form>
        </div>
      </div>
      {expanded && (
        <p id={advancedFilterNoteId} className={glass ? "mt-2 text-meta text-white/90" : "mt-2 text-meta text-ink-500"}>
          {t("filter_hint")}
        </p>
      )}
    </div>
  );
}
