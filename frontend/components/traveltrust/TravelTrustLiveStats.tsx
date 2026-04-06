"use client";

import { useEffect, useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";

const BASE = { users: 128_400, trips: 42_100, cities: 186, guides: 9_200 };

function jitter(n: number, pct: number) {
  const d = n * pct;
  return Math.round(n + (Math.random() * 2 - 1) * d);
}

function formatInt(n: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(n);
  }
}

export default function TravelTrustLiveStats({ variant = "default" }: { variant?: "default" | "glass" }) {
  const { t, locale } = useTranslation();
  const glass = variant === "glass";
  const [values, setValues] = useState(BASE);
  const titleId = useId();

  useEffect(() => {
    const id = window.setInterval(() => {
      setValues({
        users: jitter(BASE.users, 0.004),
        trips: jitter(BASE.trips, 0.006),
        cities: BASE.cities,
        guides: jitter(BASE.guides, 0.005),
      });
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  const items: { key: keyof typeof BASE; labelKey: string }[] = [
    { key: "users", labelKey: "traveltrust_stats_users" },
    { key: "trips", labelKey: "traveltrust_stats_trips" },
    { key: "cities", labelKey: "traveltrust_stats_cities" },
    { key: "guides", labelKey: "traveltrust_stats_guides" },
  ];

  return (
    <section id="live-stats" className="scroll-mt-24" aria-labelledby={titleId}>
      <h2 id={titleId} className={glass ? "text-body-l font-bold text-white" : "text-small font-semibold text-ink-900"}>
        {t("traveltrust_stats_title")}
      </h2>
      <p className={glass ? "mt-2 text-small leading-relaxed text-slate-300" : "mt-2 text-meta leading-relaxed text-ink-600"}>
        {t("traveltrust_stats_note")}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map(({ key, labelKey }) => (
          <li
            key={key}
            className={
              glass
                ? "rounded-[var(--radius-lg)] border border-white/12 bg-slate-900/50 px-5 py-4 shadow-scifi-panel motion-sub ring-1 ring-ref-cyan/15 backdrop-blur-md"
                : "rounded-[var(--radius-md)] border border-ink-200/80 bg-bg-soft/90 px-4 py-3 shadow-soft motion-sub"
            }
          >
            <p className={glass ? "text-meta text-ref-sun" : "text-meta text-ink-500"}>{t(labelKey)}</p>
            <p
              className={
                glass
                  ? "mt-1 font-mono text-h3 font-bold tabular-nums text-ref-cyan drop-shadow-scifi-cyan-title"
                  : "mt-1 font-mono text-body-l font-semibold tabular-nums text-travel-700"
              }
            >
              {formatInt(values[key], locale)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
