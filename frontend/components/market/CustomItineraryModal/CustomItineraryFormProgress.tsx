"use client";

import type { CustomItineraryForm } from "./types";
import { countItineraryDaysConfigured } from "./itineraryInterestValidation";

type Props = {
  form: CustomItineraryForm;
  t: (key: string) => string;
};

export default function CustomItineraryFormProgress({ form, t }: Props) {
  const total = Math.max(1, form.totalDays);
  const done = countItineraryDaysConfigured(form);
  const pct = Math.min(100, Math.round((done / total) * 100));
  return (
    <div
      className="rounded-[var(--radius-sm)] border border-ref-sun/20 bg-ink-900/55 px-3 py-2.5"
      role="status"
      aria-live="polite"
      data-tt-custom-itinerary-progress="1"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-meta text-white/85">
        <span>{t("market_itinerary_progress_label")}</span>
        <span>
          {t("market_itinerary_progress_days")
            .replace("{{done}}", String(done))
            .replace("{{total}}", String(total))}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-ref-sun/75 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
