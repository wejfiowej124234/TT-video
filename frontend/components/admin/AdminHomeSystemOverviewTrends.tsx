"use client";

import { useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import type { AdminHomeMetricsTrends } from "@/lib/admin/adminHomeSystemOverviewMetrics";
import {
  ADMIN_SYSTEM_OVERVIEW_TREND_BAR_AREA_CLASS,
  ADMIN_SYSTEM_OVERVIEW_TREND_BAR_COLUMN_CLASS,
  ADMIN_SYSTEM_OVERVIEW_TREND_BAR_VALUE_CLASS,
  ADMIN_SYSTEM_OVERVIEW_TREND_BARS_CLASS,
  ADMIN_SYSTEM_OVERVIEW_TREND_CHART_CLASS,
  ADMIN_SYSTEM_OVERVIEW_TREND_Y_AXIS_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_META_CLASS,
} from "@/lib/adminUi";

function dayShortLabel(iso: string): string {
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return iso;
}

function trendYTicks(peak: number): number[] {
  if (peak <= 0) return [0];
  if (peak === 1) return [1, 0];
  const mid = Math.round(peak / 2);
  return mid > 0 && mid < peak ? [peak, mid, 0] : [peak, 0];
}

function TrendChart(props: {
  title: string;
  days: string[];
  values: number[];
  barClass: string;
  unavailable?: boolean;
}) {
  const { t } = useTranslation();
  const { title, days, values, barClass, unavailable } = props;
  const peak = useMemo(() => Math.max(0, ...values), [values]);
  const scaleMax = Math.max(1, peak);
  const yTicks = useMemo(() => trendYTicks(scaleMax), [scaleMax]);
  const ariaSummary = useMemo(
    () =>
      days
        .map((day, i) => `${dayShortLabel(day)} ${values[i] ?? 0}`)
        .join("; "),
    [days, values],
  );

  return (
    <div data-tt-admin-system-overview-trend="1">
      <h3 className={`text-small font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>{title}</h3>
      {unavailable ? (
        <p className={`mt-2 text-small ${ADMIN_TEXT_META_CLASS}`}>
          {t("admin_home_system_overview_trend_unavailable")}
        </p>
      ) : (
        <>
          <p className="sr-only" data-tt-admin-system-overview-trend-readout="1">
            {title}: {ariaSummary}; {t("admin_home_system_overview_trend_y_max", { max: scaleMax })}
          </p>
          <div
            className={ADMIN_SYSTEM_OVERVIEW_TREND_CHART_CLASS}
            data-tt-admin-system-overview-trend-chart="1"
            data-tt-admin-system-overview-trend-y-max={String(scaleMax)}
          >
            <div
              className={ADMIN_SYSTEM_OVERVIEW_TREND_Y_AXIS_CLASS}
              aria-hidden
              data-tt-admin-system-overview-trend-y-axis="1"
            >
              {yTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <div
                className="pointer-events-none absolute inset-0 flex flex-col justify-between"
                aria-hidden
                data-tt-admin-system-overview-trend-grid="1"
              >
                {yTicks.slice(0, -1).map((tick) => (
                  <div key={tick} className="border-t border-ref-sun/10" />
                ))}
              </div>
              <ul
                className={ADMIN_SYSTEM_OVERVIEW_TREND_BARS_CLASS}
                aria-label={`${title} (${ariaSummary})`}
                data-tt-admin-system-overview-trend-bars="1"
              >
                {days.map((day, i) => {
                  const v = values[i] ?? 0;
                  const heightPct = Math.max(v > 0 ? 8 : 0, Math.round((v / scaleMax) * 100));
                  return (
                    <li key={day} className={ADMIN_SYSTEM_OVERVIEW_TREND_BAR_COLUMN_CLASS}>
                      <div className={ADMIN_SYSTEM_OVERVIEW_TREND_BAR_AREA_CLASS}>
                        <span className={`${ADMIN_SYSTEM_OVERVIEW_TREND_BAR_VALUE_CLASS} ${ADMIN_TEXT_META_CLASS}`}>
                          {v}
                        </span>
                        <div
                          className={`w-full max-w-[2rem] rounded-t ${barClass}`}
                          style={{ height: `${heightPct}%` }}
                          role="img"
                          aria-label={`${dayShortLabel(day)}: ${v}`}
                        />
                      </div>
                      <span className={`text-small ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>
                        {dayShortLabel(day)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminHomeSystemOverviewTrends(props: {
  trends: AdminHomeMetricsTrends | null;
  adminActivityAvailable: boolean;
  loading: boolean;
  layout?: "wide" | "stacked";
}) {
  const { t } = useTranslation();
  const { trends, adminActivityAvailable, loading, layout = "wide" } = props;

  if (loading) {
    return (
      <p className={`mt-4 text-small ${ADMIN_TEXT_META_CLASS}`} role="status">
        {t("admin_loading")}
      </p>
    );
  }

  if (!trends || trends.days.length === 0) return null;

  const gridClass =
    layout === "stacked" ? "mt-5 grid grid-cols-1 gap-4" : "mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2";

  return (
    <div className={gridClass} data-tt-admin-home-system-overview-trends="1">
      <TrendChart
        title={t("admin_home_system_overview_trend_signups")}
        days={trends.days}
        values={trends.userSignups}
        barClass="bg-ref-sun/85"
      />
      <TrendChart
        title={t("admin_home_system_overview_trend_admin_activity")}
        days={trends.days}
        values={trends.adminActivity}
        barClass="bg-slate-400/80"
        unavailable={!adminActivityAvailable}
      />
    </div>
  );
}
