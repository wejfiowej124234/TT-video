"use client";

import { useTranslation } from "@/components/LocaleProvider";

export function MarketDisplayTestBadge({ glass }: { glass?: boolean }) {
  const { t } = useTranslation();
  const label = t("market_display_test_badge");
  return (
    <span
      className={
        glass
          ? "inline-flex shrink-0 items-center rounded-[var(--radius-sm)] border border-amber-400/45 bg-amber-500/20 px-1.5 py-0.5 text-meta font-semibold uppercase tracking-wide text-amber-200"
          : "inline-flex shrink-0 items-center rounded-[var(--radius-sm)] border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-meta font-semibold uppercase tracking-wide text-amber-800"
      }
      aria-label={t("market_display_test_badge_aria")}
    >
      {label}
    </span>
  );
}
