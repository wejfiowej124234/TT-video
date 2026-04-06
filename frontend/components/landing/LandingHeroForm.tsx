"use client";

import Link from "next/link";
import { useRef, useEffect, useState, useCallback, useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import TrustBadgesRow from "@/components/trust/TrustBadgesRow";
import {
  COUNTRY_OPTIONS,
  CITIES_BY_COUNTRY,
  dateToString,
  ATTRACTION_TYPE_OPTIONS,
  STANDARD_OPTIONS,
  HOTEL_OPTIONS,
} from "./constants";
import { applyLandingDatePick } from "@/lib/landingDateRangePick";
import { landingHeroFormAlertText } from "@/lib/landingHeroFormAlert";

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
  handleSubmit: (e: React.FormEvent) => void;
}

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
  const calendarDialogTitleId = useId();
  const calendarDialogDescId = useId();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
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

  const displayRange =
    startDate && endDate
      ? `${startDate.replace(/-/g, "/")} － ${endDate.replace(/-/g, "/")}`
      : startDate
        ? `${startDate.replace(/-/g, "/")} － ...`
        : null;
  const calendarDays = getCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const monthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const formAlertText = landingHeroFormAlertText(validationErrorKey, submitError, t);

  return (
    <section id="form" className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 scroll-mt-28">
      <div className="relative z-10 w-full max-w-5xl rounded-[var(--radius-xl)] p-[1px] bg-gradient-to-br from-white/50 via-ref-cyan/35 to-ref-coral/40 shadow-[0_0_48px_-12px_rgba(35,206,217,0.2)] animate-fadeUp">
      <div
        className="relative w-full rounded-[var(--radius-xl)] border border-white/15 bg-slate-950/35 backdrop-blur-xl backdrop-saturate-150 overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(35,206,217,0.12),transparent_50%),radial-gradient(circle_at_100%_40%,rgba(252,164,124,0.1),transparent_45%)]"
          aria-hidden
        />
        <div className="relative p-6 sm:p-8 lg:p-10">
          <h1 className="text-h3 font-bold tracking-tight sm:text-h2 text-center bg-gradient-to-r from-white via-ref-cyan/95 to-ref-sun/90 bg-clip-text text-transparent drop-shadow-landing-hero">
            {t("landing_hero_title")}
          </h1>
          <p className="mt-3 text-body-l text-white/90 text-center sm:text-h4">
            {t("landing_hero_subtitle")}
          </p>
          <p className="mt-2 text-small text-white/80 text-center">
            {t("landing_hero_escrow_note")}
          </p>
          <TrustBadgesRow />
          <p className="mt-1 text-meta text-white/70 text-center">{t("landing_payment_note")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/market"
              className="rounded-full bg-white/10 backdrop-blur-sm border border-ref-cyan/35 px-4 py-2 text-small font-medium text-white hover:bg-ref-cyan/15 hover:border-ref-cyan/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {t("header_market")}
            </Link>
            <Link
              href="/#form"
              className="rounded-full bg-white/10 backdrop-blur-sm border border-white/25 px-4 py-2 text-small font-medium text-white hover:bg-white/18 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {t("landing_cta_create")}
            </Link>
            <Link
              href="/guides"
              className="rounded-full bg-white/10 backdrop-blur-sm border border-ref-sage/35 px-4 py-2 text-small font-medium text-white hover:bg-ref-sage/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {t("landing_cta_guides")}
            </Link>
            <Link
              href="/traveltrust"
              className="rounded-full border border-transparent bg-gradient-to-r from-ref-teal via-ref-cyan to-ref-teal px-4 py-2 text-small font-medium text-white shadow-[0_0_24px_-4px_rgba(35,206,217,0.4)] hover:brightness-110 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {t("landing_cta_traveltrust_network")}
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
                <span className="block rounded-[var(--radius-xl)] border border-white/30 bg-white/10 px-3 py-2.5 text-meta text-white/60">{t("market_selectCountryFirst")}</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(CITIES_BY_COUNTRY[country] ?? []).map((c) => {
                    const selected = cities.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setCities((prev) =>
                            selected ? prev.filter((v) => v !== c.value) : [...prev, c.value]
                          );
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
            {/* 出行日期 + 人数 + 房间数 + 预算 + 提交；54-S12：小屏日期独占一行，人数/房间与预算/提交成组换行，避免挤在一行。
                sm:items-end：与 /admin 浅色筛选条同系（88 §3.5 v1.0.160）——桌面端 label 与 input/button 底对齐；各行控件 min-h-[44px] 对齐 13/37（86 Experience Landing 与 25 可交叉读）。 */}
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
              <div className="relative w-full shrink-0 flex flex-col sm:w-auto" ref={calendarRef}>
                <span className="block text-meta font-medium text-white/80 mb-1">{t("landing_label_date_range")}</span>
                {/* 54 §2.8：单一「出行日期区间」外框，内为触发器 + 天数（与预算等表单项同系边框） */}
                <div className="flex w-full items-center gap-2 min-h-[44px] rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-1.5 py-1 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setCalendarOpen((o) => !o)}
                    className="flex min-h-[44px] min-w-0 w-full flex-1 items-center gap-2 rounded-[var(--radius-md)] border-0 bg-white/10 px-2.5 py-2 text-left text-small text-white placeholder:text-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:min-w-[240px] sm:w-auto"
                    aria-expanded={calendarOpen}
                    aria-haspopup="dialog"
                  >
                    <svg className="w-4 h-4 shrink-0 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {displayRange || t("landing_label_date_range_placeholder")}
                  </button>
                  {days > 0 && (
                    <span className="text-meta text-white/70 shrink-0 max-w-[5.5rem] sm:max-w-none leading-tight">
                      {t("landing_days_count").replace("{{n}}", String(days))}
                    </span>
                  )}
                </div>
                {calendarOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" aria-hidden onClick={() => setCalendarOpen(false)} />
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby={calendarDialogTitleId}
                      aria-describedby={calendarDialogDescId}
                      className="absolute left-0 top-full mt-1 z-[110] rounded-[var(--radius-xl)] border border-white/30 bg-slate-900 shadow-strong pt-4 px-4 pb-6 min-w-[280px]"
                    >
                    <h2 id={calendarDialogTitleId} className="sr-only">
                      {t("landing_label_date_range")}
                    </h2>
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
                    <div className="grid grid-cols-7 gap-0.5 mb-2">
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
                            className={`w-8 h-8 rounded-[var(--radius-sm)] text-small font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                              disabled ? "text-white/30 cursor-not-allowed" : "text-white hover:bg-white/20"
                            } ${isStart || isEnd ? "bg-cyan-500/80 text-white" : inRange ? "bg-white/15 text-white" : ""}`}
                          >
                            {cell.day || ""}
                          </button>
                        );
                      })}
                    </div>
                    <p id={calendarDialogDescId} className="mt-2 text-meta text-white/60">
                      {t("landing_date_range_hint")}
                    </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-3 sm:gap-4 min-w-0 w-full sm:flex-1">
                <label className="min-w-[64px] max-w-[80px] shrink-0 flex flex-col">
                  <span className="block text-meta font-medium text-white/80 mb-1">{t("landing_label_party_size")}</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                    className="w-full min-h-[44px] h-11 rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-2 text-white text-small focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 [&::placeholder]:text-white/50"
                  />
                </label>
                <label className="min-w-[64px] max-w-[80px] shrink-0 flex flex-col">
                  <span className="block text-meta font-medium text-white/80 mb-1">{t("landing_label_num_rooms")}</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={numRooms}
                    onChange={(e) => setNumRooms(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                    className="w-full min-h-[44px] h-11 rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-2 text-white text-small focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 [&::placeholder]:text-white/50"
                  />
                </label>
                <label className="flex-1 min-w-[100px] max-w-[160px] flex flex-col">
                  <span className="block text-meta font-medium text-white/80 mb-1">{t("landing_label_budget")}</span>
                  <div className="flex items-center min-h-[44px] h-11 rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm overflow-hidden">
                    <span className="pl-2 text-small text-white/70">$</span>
                    <input
                      type="number"
                      min="1"
                      max="999999"
                      step="1"
                      placeholder={t("landing_budget_placeholder")}
                      inputMode="numeric"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="flex-1 min-w-0 h-full py-0 pr-2 pl-0.5 text-white text-small placeholder:text-white/50 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
                    />
                    <span className="pr-2 text-meta text-white/60">{t("landing_budget_unit")}</span>
                  </div>
                </label>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting ? true : undefined}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-cta-gradient text-white flex items-center justify-center shadow-medium transition-transform hover:brightness-110 hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] active:scale-[0.98] disabled:opacity-60 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                    title={submitting ? t("landing_btn_generating") : t("landing_btn_generate")}
                    aria-label={submitting ? t("landing_btn_generating") : t("landing_btn_generate")}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </button>
                  {submitting && <span className="text-meta text-white/80">{t("landing_btn_generating")}</span>}
                </div>
              </div>
            </div>
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
                          setAttractionTypes((prev) =>
                            selected ? prev.filter((v) => v !== a.value) : [...prev, a.value]
                          );
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
                            setDiningStandards((prev) =>
                              selected ? prev.filter((v) => v !== s.value) : [...prev, s.value]
                            );
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
                            setHotelStandards((prev) =>
                              selected ? prev.filter((v) => v !== s.value) : [...prev, s.value]
                            );
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
            {formAlertText && (
              <p className="mt-3 text-small text-danger font-medium" role="alert">
                {formAlertText}
              </p>
            )}
          </form>
        </div>
      </div>
      </div>
    </section>
  );
}
