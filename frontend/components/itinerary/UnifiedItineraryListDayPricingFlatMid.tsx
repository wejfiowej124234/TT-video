"use client";

import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import { formatUnifiedItineraryAmount } from "./unifiedItineraryListConstants";
import type { UnifiedItineraryListChrome } from "./unifiedItineraryListChrome";

export type UnifiedItineraryListDayPricingFlatMidProps = {
  row: UnifiedDayRow;
  t: (k: string) => string;
  u: UnifiedItineraryListChrome;
  displayCurrency: string;
  dash: string;
  evenSplitPerDay: number | null;
};

/** Flat layout inserts price / even-split lines between attractions and dining (legacy order). */
export default function UnifiedItineraryListDayPricingFlatMid({
  row,
  t,
  u,
  displayCurrency,
  dash,
  evenSplitPerDay,
}: UnifiedItineraryListDayPricingFlatMidProps) {
  return (
    <>
      {row.price_note != null ? (
        <p className={`${u.metaMed} mt-2`}>
          {typeof row.price_note === "number"
            ? `${t("itin_dayEstimate") || "Est."} ${row.price_note} ${displayCurrency}`
            : String(row.price_note)}
        </p>
      ) : null}
      {row.price_note == null && evenSplitPerDay != null ? (
        <p className={`${u.metaMed} mt-2`} role="status">
          <span className={u.strong}>{t("itin_dayCostEvenSplitLabel")}: </span>
          {formatUnifiedItineraryAmount(evenSplitPerDay, dash)} {displayCurrency}
          <span className={`${u.metaDim} block sm:inline sm:ml-1 mt-0.5 sm:mt-0`}>{t("itin_dayCostEvenSplitHint")}</span>
        </p>
      ) : null}
      {row.price_note == null && evenSplitPerDay == null ? (
        <p className={`${u.metaDim} mt-2`} role="status">
          {t("itin_dayCostPlaceholder") || "Day cost: —"}
        </p>
      ) : null}
    </>
  );
}
