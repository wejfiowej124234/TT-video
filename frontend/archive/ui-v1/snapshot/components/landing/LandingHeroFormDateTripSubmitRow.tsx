"use client";

/* 出行日期 + 人数 + 房间数 + 预算 + 提交；54-S12：小屏日期独占一行，人数/房间与预算/提交成组换行，避免挤在一行。
   sm:items-end：与 /admin 浅色筛选条同系（88 §3.5 v1.0.160）——桌面端 label 与 input/button 底对齐；各行控件 min-h-[44px] 对齐 13/37（86 Experience Landing 与 25 可交叉读）。 */

import { useTranslation } from "@/components/LocaleProvider";
import {
  landingHeroCalendarDismissScrimClass,
  landingHeroCalendarPopoverPanelClass,
} from "@/components/market/marketStudioModalLayout";
import type { UseLandingHeroFormDateRangePickerResult } from "./useLandingHeroFormDateRangePicker";
import {
  TT_MARKETING_HOME_CALENDAR_DAY_IN_RANGE,
  TT_MARKETING_HOME_CALENDAR_DAY_SELECTED,
  TT_MARKETING_HOME_GLASS_FIELD_FOCUS,
  TT_MARKETING_HOME_GLASS_FIELD_FOCUS_INSET,
  TT_MARKETING_HOME_SUBMIT_FAB,
} from "@/lib/marketingUi";

export interface LandingHeroFormDateTripSubmitRowProps {
  days: number;
  startDate: string;
  endDate: string;
  partySize: number;
  setPartySize: (v: number) => void;
  numRooms: number;
  setNumRooms: (v: number) => void;
  budget: string;
  setBudget: (v: string) => void;
  submitting: boolean;
  dateRange: UseLandingHeroFormDateRangePickerResult;
}

export default function LandingHeroFormDateTripSubmitRow({
  days,
  startDate,
  endDate,
  partySize,
  setPartySize,
  numRooms,
  setNumRooms,
  budget,
  setBudget,
  submitting,
  dateRange,
}: LandingHeroFormDateTripSubmitRowProps) {
  const { t } = useTranslation();
  const {
    calendarDialogTitleId,
    calendarDialogDescId,
    calendarOpen,
    setCalendarOpen,
    setCalendarMonth,
    calendarRef,
    closeCalendar,
    calendarTrapRef,
    minDate,
    handleCalendarDay,
    displayRange,
    calendarDays,
    monthLabel,
  } = dateRange;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
      <div className="relative w-full shrink-0 flex flex-col sm:w-auto" ref={calendarRef}>
        <span className="block text-meta font-medium text-white/80 mb-1">{t("landing_label_date_range")}</span>
        <div className="flex w-full items-center gap-2 min-h-[44px] rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-1.5 py-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setCalendarOpen((o) => !o)}
            className="flex min-h-[44px] min-w-0 w-full flex-1 items-center gap-2 rounded-[var(--radius-md)] border-0 bg-white/10 px-2.5 py-2 text-left text-small text-white placeholder:text-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:min-w-[240px] sm:w-auto"
            aria-expanded={calendarOpen}
            aria-haspopup="dialog"
          >
            <svg className="w-4 h-4 shrink-0 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
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
            <div className={landingHeroCalendarDismissScrimClass} aria-hidden onClick={closeCalendar} />
            <div
              ref={calendarTrapRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={calendarDialogTitleId}
              aria-describedby={calendarDialogDescId}
              data-tt-landing-hero-date-dialog="1"
              className={landingHeroCalendarPopoverPanelClass}
            >
              <h2 id={calendarDialogTitleId} className="sr-only">
                {t("landing_label_date_range")}
              </h2>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                  aria-label={t("common_prev") || "Prev"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-small font-medium text-white/90 capitalize">{monthLabel}</span>
                <button
                  type="button"
                  onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                  aria-label={t("common_next") || "Next"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-meta text-white/60 mb-1">
                {(t("landing_calendar_weekdays") || "S,M,T,W,T,F,S").split(",").map((w) => (
                  <span key={w} className="py-0.5">
                    {w.trim()}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-2">
                {calendarDays.map((cell, i) => {
                  if (!cell.isCurrentMonth) return <div key={i} />;
                  const disabled = cell.date < minDate;
                  const isStart = cell.date === startDate;
                  const isEnd = cell.date === endDate;
                  const inRange = startDate && endDate && cell.date >= startDate && cell.date <= endDate;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleCalendarDay(cell.date)}
                      className={`w-8 h-8 rounded-[var(--radius-sm)] text-small font-medium ${TT_MARKETING_HOME_GLASS_FIELD_FOCUS} ${
                        disabled ? "text-white/30 cursor-not-allowed" : "text-white hover:bg-white/20"
                      } ${isStart || isEnd ? TT_MARKETING_HOME_CALENDAR_DAY_SELECTED : inRange ? TT_MARKETING_HOME_CALENDAR_DAY_IN_RANGE : ""}`}
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
            className={`w-full min-h-[44px] h-11 rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-2 text-white text-small ${TT_MARKETING_HOME_GLASS_FIELD_FOCUS} [&::placeholder]:text-white/50`}
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
            className={`w-full min-h-[44px] h-11 rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-2 text-white text-small ${TT_MARKETING_HOME_GLASS_FIELD_FOCUS} [&::placeholder]:text-white/50`}
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
              className={`flex-1 min-w-0 h-full py-0 pr-2 pl-0.5 text-white text-small placeholder:text-white/50 bg-transparent ${TT_MARKETING_HOME_GLASS_FIELD_FOCUS_INSET}`}
            />
            <span className="pr-2 text-meta text-white/60">{t("landing_budget_unit")}</span>
          </div>
        </label>
        <div className="shrink-0 flex items-center gap-2">
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
          {submitting && <span className="text-meta text-white/80">{t("landing_btn_generating")}</span>}
        </div>
      </div>
    </div>
  );
}
