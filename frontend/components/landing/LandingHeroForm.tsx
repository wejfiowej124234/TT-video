"use client";

import Link from "next/link";
import { memo, useRef, useEffect, useState, useCallback, useId, useSyncExternalStore } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import LandingHeroCityField from "@/components/landing/LandingHeroCityField";
import LandingHeroAuxLinks from "@/components/landing/LandingHeroAuxLinks";
import LandingHeroNavTabs from "@/components/landing/LandingHeroNavTabs";
import { HomeConsumerValueSection } from "@/components/landing/HomeConsumerValueSection";
import {
  dateToString,
  ATTRACTION_TYPE_OPTIONS,
  STANDARD_OPTIONS,
  HOTEL_OPTIONS,
} from "./constants";
import { useCatalogCountryOptions } from "@/lib/catalogApi/useCatalogGeo";
import { applyLandingDatePick } from "@/lib/landingDateRangePick";
import { landingHeroFormAlertText } from "@/lib/landingHeroFormAlert";
import type { LandingDraftQuota } from "@/lib/landingDraftQuota";
import {
  TT_MARKETING_HOME_CALENDAR_DAY_SELECTED,
  TT_MARKETING_HOME_CALENDAR_POPOVER,
  TT_MARKETING_HOME_CALENDAR_POPOVER_FOOTER,
  TT_MARKETING_HOME_FORM_INNER_GLOW,
  TT_MARKETING_HOME_FORM_PANEL,
  TT_MARKETING_HOME_FORM_PANEL_GLOW_CLIP,
  TT_MARKETING_HOME_HERO_CARD_FRAME,
  TT_MARKETING_HOME_HERO_GRID,
  TT_MARKETING_HOME_HERO_ACTIONS_DIVIDER,
  TT_MARKETING_HOME_HERO_ACTIONS_STACK,
  TT_MARKETING_HOME_HERO_KICKER,
  TT_MARKETING_HOME_HERO_SECTION,
  TT_MARKETING_HOME_HERO_TITLE,
  TT_MARKETING_HOME_SUBMIT_FAB,
  TT_MARKETING_HOME_GLASS_COUNT_INPUT,
  TT_MARKETING_HOME_GLASS_BUDGET_SHELL,
  TT_MARKETING_HOME_GLASS_BUDGET_INPUT,
  TT_MARKETING_HOME_CALENDAR_DAY_FOCUS,
  TT_MARKETING_HOME_CALENDAR_DAY_IN_RANGE,
  TT_MARKETING_HOME_PREFERENCES_DETAILS,
  TT_MARKETING_HOME_PREFERENCES_SUMMARY,
  ttMarketingHomeFilterPillClasses,
} from "@/lib/marketingUi";

const LG_MQL = "(min-width: 1024px)";
const LANDING_HERO_COUNT_MIN = 1;
const LANDING_HERO_COUNT_MAX = 20;

function clampLandingHeroCount(n: number): number {
  return Math.max(LANDING_HERO_COUNT_MIN, Math.min(LANDING_HERO_COUNT_MAX, n));
}

interface LandingHeroCountFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  className?: string;
}

/** 允许删空后键盘输入；失焦时 clamp 到 1–20（54 §2.8 与预算字段同系玻璃控件） */
function LandingHeroCountField({ label, value, onChange, className }: LandingHeroCountFieldProps) {
  const [draft, setDraft] = useState(() => String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commitDraft = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") {
        onChange(LANDING_HERO_COUNT_MIN);
        setDraft(String(LANDING_HERO_COUNT_MIN));
        return;
      }
      const parsed = parseInt(trimmed, 10);
      if (!Number.isFinite(parsed)) {
        onChange(LANDING_HERO_COUNT_MIN);
        setDraft(String(LANDING_HERO_COUNT_MIN));
        return;
      }
      const clamped = clampLandingHeroCount(parsed);
      onChange(clamped);
      setDraft(String(clamped));
    },
    [onChange]
  );

  return (
    <label className={className}>
      <span className="block text-meta font-medium text-white/80 mb-1">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-valuemin={LANDING_HERO_COUNT_MIN}
        aria-valuemax={LANDING_HERO_COUNT_MAX}
        aria-valuenow={value}
        value={editing ? draft : String(value)}
        onFocus={(e) => {
          setEditing(true);
          setDraft(String(value));
          e.currentTarget.select();
        }}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setDraft(digits);
          if (digits !== "") onChange(clampLandingHeroCount(parseInt(digits, 10)));
        }}
        onBlur={() => {
          setEditing(false);
          commitDraft(draft);
        }}
        className={TT_MARKETING_HOME_GLASS_COUNT_INPUT}
      />
    </label>
  );
}

function subscribeLgUp(onStoreChange: () => void) {
  const mql = window.matchMedia(LG_MQL);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getLgUpSnapshot() {
  return window.matchMedia(LG_MQL).matches;
}

function getLgUpServerSnapshot() {
  return true;
}

export interface LandingHeroFormProps {
  country: string;
  setCountry: (v: string) => void;
  cities: string[];
  setCities: (v: string[] | ((prev: string[]) => string[])) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  days: number;
  attractionTypes: string[];
  setAttractionTypes: (v: string[] | ((prev: string[]) => string[])) => void;
  diningStandards: string[];
  setDiningStandards: (v: string[] | ((prev: string[]) => string[])) => void;
  hotelStandards: string[];
  setHotelStandards: (v: string[] | ((prev: string[]) => string[])) => void;
  budget: string;
  setBudget: (v: string) => void;
  partySize: number;
  setPartySize: (v: number) => void;
  numRooms: number;
  setNumRooms: (v: number) => void;
  submitting: boolean;
  /** 客户端校验 i18n key（`landing_error_*`） */
  validationErrorKey: string | null;
  /** API 错误：已由 hook 内 `mapApiReadError` / `t` 翻译 */
  submitError: string | null;
  /** 未登录提交：展示登录 CTA */
  loginRequired: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  /** Hero「自由市场」Tab：带当前目的地/天数 query */
  marketHref?: string;
  /** 首屏价值预览（无结果且未提交时） */
  showConsumerValue?: boolean;
  /** 登录用户 Draft 配额（生成前预检） */
  draftQuota?: LandingDraftQuota;
}

function LandingHeroForm({
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
  loginRequired,
  handleSubmit,
  marketHref,
  showConsumerValue = false,
  draftQuota = { count: 0, cap: 20, blocked: false },
}: LandingHeroFormProps) {
  const { t } = useTranslation();
  const countryOptions = useCatalogCountryOptions();
  const heroTitleId = useId();
  const formAlertId = useId();
  const countryFieldId = useId();
  const calendarDialogTitleId = useId();
  const calendarDialogDescId = useId();
  const formAlertRef = useRef<HTMLDivElement>(null);
  const draftCapBannerRef = useRef<HTMLDivElement>(null);
  const countryFieldRef = useRef<HTMLFieldSetElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [prefsOpenMobile, setPrefsOpenMobile] = useState(false);
  const lgUp = useSyncExternalStore(subscribeLgUp, getLgUpSnapshot, getLgUpServerSnapshot);
  const calendarRef = useRef<HTMLDivElement>(null);

  const minDate = dateToString(new Date());

  const getCalendarDays = useCallback((year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const rows: { date: string; day: number; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < startPad; i++) rows.push({ date: "", day: 0, isCurrentMonth: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = dateToString(new Date(year, month, d));
      rows.push({ date, day: d, isCurrentMonth: true });
    }
    return rows;
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;
    const close = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setCalendarOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [calendarOpen]);

  useEffect(() => {
    if (!calendarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCalendarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [calendarOpen]);

  const handleCalendarDay = useCallback(
    (date: string) => {
      const r = applyLandingDatePick({
        picked: date,
        minDate,
        startDate,
        endDate,
      });
      setStartDate(r.startDate);
      setEndDate(r.endDate);
      if (r.shouldCloseCalendar) setCalendarOpen(false);
    },
    [minDate, startDate, endDate, setStartDate, setEndDate]
  );

  const syncCalendarMonthToAnchor = useCallback(() => {
    const anchor = startDate || endDate || minDate;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(anchor);
    if (m) {
      setCalendarMonth(new Date(Number(m[1]), Number(m[2]) - 1, 1));
    }
  }, [startDate, endDate, minDate]);

  const toggleCalendarOpen = useCallback(() => {
    setCalendarOpen((open) => {
      if (open) return false;
      syncCalendarMonthToAnchor();
      return true;
    });
  }, [syncCalendarMonthToAnchor]);

  const displayRange =
    startDate && endDate
      ? `${startDate.replace(/-/g, "/")} － ${endDate.replace(/-/g, "/")}`
      : startDate
        ? `${startDate.replace(/-/g, "/")} － ...`
        : null;
  const calendarDays = getCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const monthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const formAlertText = landingHeroFormAlertText(
    loginRequired ? null : validationErrorKey,
    loginRequired ? null : submitError,
    t
  );
  const draftCapAlertText =
    validationErrorKey === "landing_error_draft_cap"
      ? t("landing_error_draft_cap")
          .replace(/\{\{count\}\}/g, String(draftQuota.count))
          .replace(/\{\{cap\}\}/g, String(draftQuota.cap))
      : null;
  const countryInvalid = validationErrorKey === "landing_error_country";
  const draftCapActive = draftQuota.blocked || validationErrorKey === "landing_error_draft_cap";
  const bottomAlertText = loginRequired ? null : draftCapAlertText ?? formAlertText;
  const showDraftCapBottomCta = validationErrorKey === "landing_error_draft_cap" || draftQuota.blocked;
  const draftCapHiddenHint =
    draftCapActive &&
    typeof draftQuota.visibleCount === "number" &&
    draftQuota.visibleCount < draftQuota.count
      ? t("landing_error_draft_cap_hidden_hint")
          .replace(/\{\{visible\}\}/g, String(draftQuota.visibleCount))
          .replace(/\{\{count\}\}/g, String(draftQuota.count))
      : null;
  const draftCapBannerText = t("landing_draft_cap_preflight")
    .replace(/\{\{count\}\}/g, String(draftQuota.count))
    .replace(/\{\{cap\}\}/g, String(draftQuota.cap));

  useEffect(() => {
    if (bottomAlertText) {
      formAlertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (draftCapActive && draftQuota.blocked) {
      draftCapBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [bottomAlertText, draftCapActive, draftQuota.blocked]);
  const loginReturnUrl = encodeURIComponent("/");
  const budgetNum = budget ? parseFloat(budget) : NaN;
  const budgetQuoteHint =
    budget && !Number.isNaN(budgetNum) && budgetNum > 0
      ? t("landing_budget_quote_hint")
          .replace(/\{\{min\}\}/g, String(Math.round(budgetNum * 0.8)))
          .replace(/\{\{max\}\}/g, budget.trim())
          .replace(/\{\{mid\}\}/g, String(Math.round(budgetNum * 0.9)))
      : null;

  return (
    <section id="form" className={TT_MARKETING_HOME_HERO_SECTION} data-tt-home-first-task="plan">
      <div className={TT_MARKETING_HOME_HERO_GRID}>
        <div className={TT_MARKETING_HOME_HERO_CARD_FRAME}>
          <div className={TT_MARKETING_HOME_FORM_PANEL}>
        <div className={TT_MARKETING_HOME_FORM_PANEL_GLOW_CLIP} aria-hidden>
          <div className={TT_MARKETING_HOME_FORM_INNER_GLOW} />
        </div>
        <div className="relative p-6 sm:p-8 lg:p-10">
          <p className={`${TT_MARKETING_HOME_HERO_KICKER} break-keep`}>
            <span className="text-ref-sun">{t("landing_hero_kicker")}</span>
            <span className="mx-2 text-white/40" aria-hidden>
              ·
            </span>
            <span className="normal-case tracking-normal text-white/85">{t("landing_hero_kicker_task")}</span>
          </p>
          <h1 id={heroTitleId} className={`${TT_MARKETING_HOME_HERO_TITLE} break-keep px-1`}>
            {t("landing_hero_title")}
          </h1>
          <p className="mt-3 max-w-2xl mx-auto break-keep text-body-l text-white/90 text-center text-pretty leading-relaxed sm:text-h4 sm:leading-snug">
            {t("landing_hero_subtitle")}
          </p>
          <p className="mt-2 max-w-xl mx-auto break-keep text-meta text-white/75 text-center text-pretty">
            {t("landing_hero_action_note")}
          </p>
          {showConsumerValue ? (
            <HomeConsumerValueSection t={t} className="mt-5 mb-1" />
          ) : null}
          <div className={TT_MARKETING_HOME_HERO_ACTIONS_STACK}>
            <LandingHeroAuxLinks />
            <div className={TT_MARKETING_HOME_HERO_ACTIONS_DIVIDER}>
              <LandingHeroNavTabs marketHref={marketHref} />
            </div>
          </div>

          <form
            id="landing-hero-form"
            onSubmit={handleSubmit}
            className="mt-8 space-y-7"
            aria-labelledby={heroTitleId}
          >
            {draftCapActive ? (
              <div
                ref={draftCapBannerRef}
                className="rounded-[var(--radius-lg)] border border-ref-sun/55 bg-ref-sun/16 px-4 py-3 backdrop-blur-sm"
                role="alert"
                aria-live="assertive"
                data-tt-landing-draft-cap-banner="1"
              >
                <p className="text-small font-semibold text-white leading-relaxed">{draftCapBannerText}</p>
                {draftCapHiddenHint ? (
                  <p className="mt-1.5 text-meta text-white/75 leading-snug">{draftCapHiddenHint}</p>
                ) : null}
                <Link
                  href="/orders?state=draft"
                  className="mt-2 inline-flex min-h-9 items-center rounded-[var(--radius-md)] bg-white/15 px-3 text-small font-semibold text-ref-sun hover:bg-white/25"
                >
                  {t("landing_error_draft_cap_cta")}
                </Link>
              </div>
            ) : null}
            <fieldset
              ref={countryFieldRef}
              className={`space-y-3 border-0 p-0 m-0 min-w-0 ${countryInvalid ? "rounded-[var(--radius-md)] ring-2 ring-ref-sun/55 ring-offset-2 ring-offset-transparent" : ""}`}
              aria-invalid={countryInvalid || undefined}
              aria-describedby={countryInvalid && bottomAlertText ? formAlertId : undefined}
            >
              <legend id={countryFieldId} className="block w-full text-meta font-medium text-white/80 mb-0">
                {t("landing_label_country_single")}
              </legend>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby={countryFieldId}>
                {countryOptions.map((c) => {
                  const selected = country === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setCountry(c.value);
                        setCities([]);
                      }}
                      className={ttMarketingHomeFilterPillClasses(selected, "country")}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <LandingHeroCityField
              country={country}
              cities={cities}
              setCities={setCities}
              citiesInvalid={validationErrorKey === "landing_error_cities"}
              countryMissing={!country}
              errorDescribedById={
                validationErrorKey === "landing_error_cities" && formAlertText ? formAlertId : undefined
              }
            />
            {/* 出行日期独占一行；人数/房间/预算/提交次行底对齐；报价说明第三行全宽（避免 hint 撑乱 items-end） */}
            <div className="space-y-4">
              <div className="relative w-full max-w-md shrink-0 flex flex-col" ref={calendarRef}>
                <span className="block text-meta font-medium text-white/80 mb-1">{t("landing_label_date_range")}</span>
                <div className="flex w-full items-center gap-2 min-h-[44px] rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-1.5 py-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCalendarOpen();
                    }}
                    className="flex min-h-[44px] min-w-0 w-full flex-1 items-center gap-2 rounded-[var(--radius-md)] border-0 bg-white/10 px-2.5 py-2 text-left text-small text-white placeholder:text-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:min-w-[240px]"
                    aria-expanded={calendarOpen}
                    aria-haspopup="dialog"
                  >
                    <svg className="w-4 h-4 shrink-0 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="min-w-0 truncate">{displayRange || t("landing_label_date_range_placeholder")}</span>
                  </button>
                  {days > 0 && (
                    <span className="shrink-0 whitespace-nowrap text-meta text-white/70 leading-tight">
                      {t("landing_days_count").replace("{{n}}", String(days))}
                    </span>
                  )}
                </div>
                {calendarOpen && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby={calendarDialogTitleId}
                      aria-describedby={calendarDialogDescId}
                      className={TT_MARKETING_HOME_CALENDAR_POPOVER}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                    <h2 id={calendarDialogTitleId} className="sr-only">
                      {t("landing_label_date_range")}
                    </h2>
                    <div className="px-4 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
                        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        aria-label={t("common_prev") || "Prev"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-small font-medium text-white/90 capitalize">{monthLabel}</span>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
                        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        aria-label={t("common_next") || "Next"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-meta text-white/60 mb-1">
                      {(t("landing_calendar_weekdays") || "S,M,T,W,T,F,S").split(",").map((w) => (
                        <span key={w} className="py-0.5">{w.trim()}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 pb-1">
                      {calendarDays.map((cell, i) => {
                        if (!cell.isCurrentMonth) return <div key={i} />;
                        const disabled = cell.date < minDate;
                        const isStart = cell.date === startDate;
                        const isEnd = cell.date === endDate;
                        const inRange =
                          startDate &&
                          endDate &&
                          cell.date >= startDate &&
                          cell.date <= endDate;
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleCalendarDay(cell.date)}
                            className={`w-8 h-8 rounded-[var(--radius-sm)] text-small font-medium ${TT_MARKETING_HOME_CALENDAR_DAY_FOCUS} ${
                              disabled ? "text-white/30 cursor-not-allowed" : "text-white hover:bg-white/20"
                            } ${isStart || isEnd ? TT_MARKETING_HOME_CALENDAR_DAY_SELECTED : inRange ? TT_MARKETING_HOME_CALENDAR_DAY_IN_RANGE : ""}`}
                          >
                            {cell.day || ""}
                          </button>
                        );
                      })}
                    </div>
                    </div>
                    <div className={TT_MARKETING_HOME_CALENDAR_POPOVER_FOOTER}>
                      <p id={calendarDialogDescId} className="text-meta leading-snug text-white/60">
                        {t("landing_date_range_hint")}
                      </p>
                    </div>
                    </div>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-3 sm:gap-x-4">
                <LandingHeroCountField
                  label={t("landing_label_party_size")}
                  value={partySize}
                  onChange={setPartySize}
                  className="w-[4.5rem] shrink-0 flex flex-col"
                />
                <LandingHeroCountField
                  label={t("landing_label_num_rooms")}
                  value={numRooms}
                  onChange={setNumRooms}
                  className="w-[4.5rem] shrink-0 flex flex-col"
                />
                <label className="flex min-w-[7.5rem] flex-1 flex-col sm:max-w-[11rem] sm:flex-none">
                  <span className="block text-meta font-medium text-white/80 mb-1">{t("landing_label_budget")}</span>
                  <div className={TT_MARKETING_HOME_GLASS_BUDGET_SHELL}>
                    <span className="shrink-0 text-small text-white/70" aria-hidden>
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={t("landing_budget_placeholder")}
                      value={budget}
                      onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
                      className={TT_MARKETING_HOME_GLASS_BUDGET_INPUT}
                    />
                  </div>
                </label>
                <div className="ml-auto flex shrink-0 items-center gap-2 self-end sm:ml-0 sm:gap-3">
                  <span className="hidden sm:inline shrink-0 whitespace-nowrap text-meta font-medium text-white/90">
                    {submitting ? t("landing_btn_generating") : t("landing_btn_generate")}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting ? true : undefined}
                    className={TT_MARKETING_HOME_SUBMIT_FAB}
                    title={submitting ? t("landing_btn_generating") : t("landing_btn_generate")}
                    aria-label={submitting ? t("landing_btn_generating") : t("landing_btn_generate")}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </button>
                </div>
              </div>
              {bottomAlertText ? (
                <div
                  ref={formAlertRef}
                  id={formAlertId}
                  className="rounded-[var(--radius-lg)] border border-ref-sun/55 bg-ref-sun/16 px-4 py-3 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,183,77,0.15)]"
                  role="alert"
                  aria-live="assertive"
                  data-tt-landing-form-alert="1"
                >
                  <p className="text-small font-semibold text-white leading-relaxed">{bottomAlertText}</p>
                  {draftCapHiddenHint && showDraftCapBottomCta ? (
                    <p className="mt-1.5 text-meta text-white/75 leading-snug">{draftCapHiddenHint}</p>
                  ) : null}
                  {showDraftCapBottomCta ? (
                    <Link
                      href="/orders?state=draft"
                      className="mt-2 inline-flex min-h-9 items-center rounded-[var(--radius-md)] bg-white/15 px-3 text-small font-semibold text-ref-sun hover:bg-white/25"
                    >
                      {t("landing_error_draft_cap_cta")}
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {budgetQuoteHint ? (
                <p className="max-w-2xl text-meta leading-snug text-white/85 text-ref-sun/90 break-words">{budgetQuoteHint}</p>
              ) : null}
              <p
                className="max-w-2xl text-meta leading-snug text-white/70"
                data-tt-home-itinerary-generate-honesty="phase1-mock-ai-not-production"
              >
                {t("landing_hero_itinerary_disclaimer")}
              </p>
              {loginRequired ? (
                <div
                  className="rounded-[var(--radius-lg)] border border-danger/40 bg-danger/10 px-4 py-3"
                  role="alert"
                  data-testid="landing-login-cta"
                >
                  <p className="text-small text-white font-medium">{t("landing_error_login")}</p>
                  <Link
                    href={`/auth/login?returnUrl=${loginReturnUrl}`}
                    className="mt-2 inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] bg-white/20 px-4 text-small font-semibold text-white hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    {t("landing_error_login_cta")}
                  </Link>
                </div>
              ) : null}
            </div>
            <details
              className={TT_MARKETING_HOME_PREFERENCES_DETAILS}
              open={lgUp || prefsOpenMobile}
              onToggle={(e) => {
                if (lgUp) return;
                setPrefsOpenMobile(e.currentTarget.open);
              }}
            >
              <summary className={`${TT_MARKETING_HOME_PREFERENCES_SUMMARY} lg:hidden`}>
                <span>{t("landing_section_preferences")}</span>
                <span className="text-meta font-normal text-white/55" aria-hidden>
                  ▾
                </span>
              </summary>
              <h3 className="hidden lg:block text-small font-semibold text-white/95 mb-4">
                {t("landing_section_preferences")}
              </h3>
              <div className="mt-4 space-y-5 pb-1">
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
                          setAttractionTypes((prev) =>
                            selected ? prev.filter((v) => v !== a.value) : [...prev, a.value]
                          );
                        }}
                        className={ttMarketingHomeFilterPillClasses(selected)}
                      >
                        {t(a.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-x-8">
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
                            setDiningStandards((prev) =>
                              selected ? prev.filter((v) => v !== s.value) : [...prev, s.value]
                            );
                          }}
                          className={ttMarketingHomeFilterPillClasses(selected)}
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
                            setHotelStandards((prev) =>
                              selected ? prev.filter((v) => v !== s.value) : [...prev, s.value]
                            );
                          }}
                          className={ttMarketingHomeFilterPillClasses(selected)}
                        >
                          {t(s.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
            </details>
          </form>
        </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(LandingHeroForm);
