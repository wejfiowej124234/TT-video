"use client";

import { useEffect, useState, useId, type FormEvent } from "react";
import { getGuideAvailability } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import { useTranslation } from "@/components/LocaleProvider";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type OccupiedRange = {
  order_id: string;
  start_date: string;
  end_date: string;
  source?: string;
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

/** B-079：`/guides/[id]` 档期占用（与 `GET …/guides/:id/availability` 一致） */
export default function GuideOccupiedScheduleBlock({ guideId }: { guideId: string }) {
  const { t, locale } = useTranslation();
  const headingId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ranges, setRanges] = useState<OccupiedRange[]>([]);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGuideAvailability(guideId)
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

  const locTag = locale === "zh" ? "zh-CN" : "en-US";
  const now = new Date();
  const months: { y: number; m0: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ y: d.getFullYear(), m0: d.getMonth() });
  }

  return (
    <section
      className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md shadow-scifi-panel-md"
      aria-labelledby={headingId}
    >
      <h2
        id={headingId}
        className="text-body font-semibold text-cyan-200 px-4 pt-4 pb-2 border-b border-slate-600/50"
      >
        {t("guide_availability_title")}
      </h2>
      <div className="p-4 space-y-4">
        <p className="text-meta text-slate-400">{t("guide_availability_intro")}</p>

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
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${travelFocusRingOffset2Classes}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 text-meta">
              <span className="inline-flex items-center gap-2 text-slate-300">
                <span className="h-3 w-3 rounded-sm border border-slate-500 bg-slate-800/60" aria-hidden />
                {t("guide_availability_legend_free")}
              </span>
              <span className="inline-flex items-center gap-2 text-rose-200">
                <span className="h-3 w-3 rounded-sm border border-rose-500/60 bg-rose-500/15" aria-hidden />
                {t("guide_availability_legend_busy")}
              </span>
            </div>

            <div className="space-y-6">
              {months.map(({ y, m0 }) => {
                const title = new Date(y, m0, 1).toLocaleDateString(locTag, { month: "long", year: "numeric" });
                const cells = buildMonthCells(y, m0);
                return (
                  <div key={`${y}-${m0}`}>
                    <h3 className="text-small font-semibold text-slate-200 mb-2">{title}</h3>
                    <div className="grid grid-cols-7 gap-1" role="grid" aria-label={title}>
                      {DOW_KEYS.map((k) => (
                        <div
                          key={k}
                          className="text-center text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 py-1"
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
                        const busy = isOccupied(ymdStr, ranges);
                        return (
                          <div
                            key={ymdStr}
                            role="gridcell"
                            aria-label={
                              busy
                                ? t("guide_availability_dayBusy").replace("{{date}}", ymdStr)
                                : t("guide_availability_dayFree").replace("{{date}}", ymdStr)
                            }
                            className={`min-h-[36px] flex items-center justify-center rounded-[var(--radius-sm)] text-small font-mono tabular-nums ${
                              busy
                                ? "border border-rose-500/50 bg-rose-500/10 text-rose-100"
                                : "border border-slate-600/40 bg-slate-800/40 text-slate-200"
                            }`}
                          >
                            {cell.day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {ranges.length > 0 ? (
              <div className="pt-2 border-t border-slate-600/40">
                <p className="text-meta font-medium text-slate-300 mb-2">{t("guide_availability_ranges_heading")}</p>
                <ul className="text-meta text-slate-400 space-y-1 list-disc pl-5">
                  {ranges.map((r) => (
                    <li key={`${r.order_id}-${r.start_date}-${r.end_date}`}>
                      {r.start_date} – {r.end_date}
                      {r.source === "lock" || r.source === "order"
                        ? ` · ${t(`guide_availability_source_${r.source}`)}`
                        : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-meta text-slate-400">{t("guide_availability_none")}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
