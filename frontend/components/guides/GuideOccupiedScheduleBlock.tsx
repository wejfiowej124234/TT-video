"use client";

import { useEffect, useState, useId, type FormEvent } from "react";

import { fetchGuideAvailabilityCached } from "@/lib/guideAvailabilityClient";
import { isYmdInRange } from "@/lib/guideBookingDates";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import {
  GUIDE_DETAIL_PANEL_FRAME_CLASS,
  GUIDE_DETAIL_PANEL_INNER_CLASS,
  GUIDE_DETAIL_RETRY_PILL_CLASS,
  GUIDE_DETAIL_SECTION_HEADING_CLASS,
} from "@/app/guides/[id]/guideDetailPageConstants";

export type OccupiedRange = {
  order_id: string;
  start_date: string;
  end_date: string;
  source?: string;
};

export type GuideTripDateSelection = {
  start: string;
  end: string;
};

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isOccupied(ymdStr: string, ranges: OccupiedRange[]): boolean {
  return ranges.some((r) => ymdStr >= r.start_date && ymdStr <= r.end_date);
}

function buildMonthCells(year: number, month0: number): ({ day: number } | null)[] {
  const first = new Date(year, month0, 1);
  const pad = (first.getDay() + 6) % 7;
  const dim = new Date(year, month0 + 1, 0).getDate();
  const cells: ({ day: number } | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const DOW_KEYS = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;
const p = TT_MARKETING_MARKET_DARK_PATH;

function MonthGrid({
  y,
  m0,
  ranges,
  locTag,
  t,
  todayYmd,
  selectable,
  selectedStart,
  selectedEnd,
  onDayClick,
}: {
  y: number;
  m0: number;
  ranges: OccupiedRange[];
  locTag: string;
  t: (key: string) => string;
  todayYmd: string;
  selectable?: boolean;
  selectedStart?: string;
  selectedEnd?: string;
  onDayClick?: (ymd: string) => void;
}) {
  const title = new Date(y, m0, 1).toLocaleDateString(locTag, { month: "long", year: "numeric" });
  const cells = buildMonthCells(y, m0);
  const hasSelection = !!(selectedStart && selectedEnd);

  return (
    <div>
      <h3 className="text-small font-semibold text-slate-200 mb-2">{title}</h3>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={title}>
        {DOW_KEYS.map((k) => (
          <div
            key={k}
            className="text-center text-[0.65rem] font-medium text-slate-400 py-1"
            role="columnheader"
          >
            {t(`guide_availability_dow_${k}`)}
          </div>
        ))}
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`e-${idx}`} className="min-h-[36px]" aria-hidden />;
          }
          const date = new Date(y, m0, cell.day);
          const ymdStr = toYmd(date);
          const isPast = ymdStr < todayYmd;
          const busy = !isPast && isOccupied(ymdStr, ranges);
          const inSelection =
            hasSelection && selectedStart && selectedEnd && isYmdInRange(ymdStr, selectedStart, selectedEnd);
          const isStart = selectedStart === ymdStr;
          const isEnd = selectedEnd === ymdStr;
          const canPick = selectable && !isPast && !busy;

          const cellClass = isPast
            ? "border border-slate-600/30 bg-slate-800/25 text-slate-500 opacity-55 cursor-not-allowed"
            : busy
              ? "border border-rose-500/50 bg-rose-500/10 text-rose-100"
              : inSelection
                ? "border border-ref-sun/70 bg-ref-sun/20 text-slate-50"
                : "border border-ref-sun/16 bg-ink-900/50 text-slate-200";

          const inner = (
            <div
              role="gridcell"
              aria-disabled={isPast || busy ? true : undefined}
              aria-selected={inSelection ? true : undefined}
              aria-label={
                isPast
                  ? t("guide_availability_dayPast").replace("{{date}}", ymdStr)
                  : busy
                    ? t("guide_availability_dayBusy").replace("{{date}}", ymdStr)
                    : inSelection
                      ? t("guide_availability_daySelected").replace("{{date}}", ymdStr)
                      : t("guide_availability_dayFree").replace("{{date}}", ymdStr)
              }
              data-tt-guide-availability-past={isPast ? "1" : undefined}
              data-tt-guide-availability-selected={inSelection ? "1" : undefined}
              className={`min-h-[36px] flex items-center justify-center rounded-[var(--radius-sm)] text-small font-mono tabular-nums ${cellClass} ${
                canPick ? "cursor-pointer hover:border-ref-sun/45 hover:bg-ref-sun/10" : ""
              } ${isStart || isEnd ? "ring-1 ring-ref-sun/80" : ""}`}
            >
              {cell.day}
            </div>
          );

          if (canPick && onDayClick) {
            return (
              <button
                key={ymdStr}
                type="button"
                className="p-0 border-0 bg-transparent min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 rounded-[var(--radius-sm)]"
                onClick={() => onDayClick(ymdStr)}
              >
                {inner}
              </button>
            );
          }

          return <div key={ymdStr}>{inner}</div>;
        })}
      </div>
    </div>
  );
}

/** B-079：`/guides/[id]` 档期占用（消费者 · 默认本月 + 可展开；可选日期选择） */
export default function GuideOccupiedScheduleBlock({
  guideId,
  selectable = false,
  selectedTrip,
  onTripSelect,
}: {
  guideId: string;
  /** 游客选出行日期（L5 预约链） */
  selectable?: boolean;
  selectedTrip?: GuideTripDateSelection | null;
  onTripSelect?: (trip: GuideTripDateSelection | null) => void;
}) {
  const { t, locale } = useTranslation();
  const headingId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ranges, setRanges] = useState<OccupiedRange[]>([]);
  const [retryTick, setRetryTick] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [pickStart, setPickStart] = useState<string | null>(selectedTrip?.start ?? null);

  useEffect(() => {
    setPickStart(selectedTrip?.start ?? null);
  }, [selectedTrip?.start, selectedTrip?.end]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGuideAvailabilityCached(guideId)
      .then((data) => {
        if (cancelled) return;
        const raw = data.occupied_ranges;
        if (!Array.isArray(raw)) {
          setRanges([]);
          return;
        }
        const next: OccupiedRange[] = [];
        for (const item of raw) {
          if (!item || typeof item !== "object") continue;
          const o = item as Record<string, unknown>;
          const order_id = typeof o.order_id === "string" ? o.order_id : "";
          const start_date = typeof o.start_date === "string" ? o.start_date : "";
          const end_date = typeof o.end_date === "string" ? o.end_date : "";
          const source = typeof o.source === "string" ? o.source : undefined;
          if (order_id && start_date && end_date) next.push({ order_id, start_date, end_date, source });
        }
        setRanges(next);
      })
      .catch((e) => {
        if (cancelled) return;
        setRanges([]);
        setError(mapApiReadError(e, t, "guide_availability_loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guideId, retryTick, t]);

  const handleDayClick = (ymd: string) => {
    if (!selectable || !onTripSelect) return;
    if (isOccupied(ymd, ranges)) return;
    if (!pickStart || ymd < pickStart) {
      setPickStart(ymd);
      onTripSelect(null);
      return;
    }
    setPickStart(null);
    onTripSelect({ start: pickStart, end: ymd });
  };

  const locTag = locale === "zh" ? "zh-CN" : "en-US";
  const now = new Date();
  const todayYmd = toYmd(now);
  const months: { y: number; m0: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ y: d.getFullYear(), m0: d.getMonth() });
  }
  const visibleMonths = expanded ? months : months.slice(0, 1);
  const selectedStart = selectedTrip?.start ?? pickStart ?? undefined;
  const selectedEnd = selectedTrip?.end;
  const itineraryTripLocked = !selectable && !!selectedTrip;

  return (
    <section className={`${GUIDE_DETAIL_PANEL_FRAME_CLASS} overflow-hidden`} aria-labelledby={headingId}>
      <div className={GUIDE_DETAIL_PANEL_INNER_CLASS}>
        <h2 id={headingId} className={GUIDE_DETAIL_SECTION_HEADING_CLASS}>
          {t("guide_availability_title")}
        </h2>
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-meta text-slate-400">
            {itineraryTripLocked
              ? t("guide_availability_itinerary_trip_intro")
              : selectable
                ? t("guide_availability_picker_intro")
                : t("guide_availability_intro")}
          </p>

          {loading ? (
            <div className="flex justify-center py-6" role="status" aria-live="polite">
              <LoadingText />
            </div>
          ) : error ? (
            <div className="space-y-3">
              <ApiErrorAlert message={error} tone="dark" />
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  setRetryTick((k) => k + 1);
                }}
              >
                <button type="submit" aria-label={t("common_retry")} className={GUIDE_DETAIL_RETRY_PILL_CLASS}>
                  {t("common_retry")}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-small font-medium text-slate-200">
                  {itineraryTripLocked
                    ? t("guide_availability_itinerary_trip_kicker")
                    : selectable
                      ? t("guide_availability_picker_kicker")
                      : t("guide_availability_this_month_kicker")}
                </p>
                <div className="flex flex-wrap gap-4 text-meta">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <span className="h-3 w-3 rounded-sm border border-ref-sun/28 bg-ink-900/55" aria-hidden />
                    {t("guide_availability_legend_free")}
                  </span>
                  <span className="inline-flex items-center gap-2 text-rose-200">
                    <span className="h-3 w-3 rounded-sm border border-rose-500/60 bg-rose-500/15" aria-hidden />
                    {t("guide_availability_legend_busy")}
                  </span>
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    <span
                      className="h-3 w-3 rounded-sm border border-slate-600/40 bg-slate-800/35 opacity-55"
                      aria-hidden
                    />
                    {t("guide_availability_legend_past")}
                  </span>
                  {selectable || selectedTrip ? (
                    <span className="inline-flex items-center gap-2 text-ref-sun/90">
                      <span className="h-3 w-3 rounded-sm border border-ref-sun/70 bg-ref-sun/25" aria-hidden />
                      {itineraryTripLocked
                        ? t("guide_availability_legend_itinerary")
                        : t("guide_availability_legend_selected")}
                    </span>
                  ) : null}
                </div>
              </div>

              {selectedTrip ? (
                <p className="text-small text-slate-200" role="status" data-tt-guide-trip-selected="1">
                  {(itineraryTripLocked
                    ? t("guide_availability_itinerary_trip_range")
                    : t("guide_availability_selected_range")
                  ).replace("{{range}}", `${selectedTrip.start} – ${selectedTrip.end}`)}
                </p>
              ) : selectable && pickStart ? (
                <p className="text-small text-slate-400" role="status">
                  {t("guide_availability_pick_end_hint")}
                </p>
              ) : null}

              <div className="space-y-6">
                {visibleMonths.map(({ y, m0 }) => (
                  <MonthGrid
                    key={`${y}-${m0}`}
                    y={y}
                    m0={m0}
                    ranges={ranges}
                    locTag={locTag}
                    t={t}
                    todayYmd={todayYmd}
                    selectable={selectable}
                    selectedStart={selectedStart}
                    selectedEnd={selectedEnd}
                    onDayClick={handleDayClick}
                  />
                ))}
              </div>

              {months.length > 1 ? (
                <button
                  type="button"
                  className={`${touchTargetLink44Classes} ${p.cardDetailsToggle}`}
                  aria-expanded={expanded}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? t("guide_availability_collapse") : t("guide_availability_expand")}
                </button>
              ) : null}

              {ranges.length === 0 ? (
                <p className="text-meta text-slate-400">{t("guide_availability_none")}</p>
              ) : (
                <p className="text-meta text-slate-500">{t("guide_availability_busy_after_accept")}</p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
