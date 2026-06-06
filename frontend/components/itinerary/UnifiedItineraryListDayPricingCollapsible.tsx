"use client";

import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import { formatUnifiedItineraryAmount } from "./unifiedItineraryListConstants";
import type { UnifiedItineraryListChrome } from "./unifiedItineraryListChrome";

export type UnifiedItineraryListDayPricingCollapsibleProps = {
  row: UnifiedDayRow;
  t: (k: string) => string;
  u: UnifiedItineraryListChrome;
  displayCurrency: string;
  dash: string;
  evenSplitPerDay: number | null;
  isExpanded: boolean;
  desc: string;
  images: string[];
};

export default function UnifiedItineraryListDayPricingCollapsible({
  row,
  t,
  u,
  displayCurrency,
  dash,
  evenSplitPerDay,
  isExpanded,
  desc,
  images,
}: UnifiedItineraryListDayPricingCollapsibleProps) {
  return (
    <>
      {row.price_note != null ? (
        <p className={`${u.metaMed} mt-2`} role="text">
          {typeof row.price_note === "number"
            ? `${t("itin_daySubtotalEstimate") || "Day subtotal (est.)"}: ${row.price_note} ${displayCurrency}`
            : String(row.price_note)}
        </p>
      ) : null}
      {isExpanded && row.price_note == null && evenSplitPerDay != null ? (
        <p className={`${u.metaMed} mt-2`} role="status">
          <span className={u.strong}>{t("itin_dayCostEvenSplitLabel")}: </span>
          {formatUnifiedItineraryAmount(evenSplitPerDay, dash)} {displayCurrency}
          <span className={`${u.metaDim} block sm:inline sm:ml-1 mt-0.5 sm:mt-0`}>{t("itin_dayCostEvenSplitHint")}</span>
        </p>
      ) : null}
      {isExpanded && row.price_note == null && evenSplitPerDay == null ? (
        <p className={`${u.metaDim} mt-2`} role="status">
          {t("itin_dayCostPlaceholder")}
        </p>
      ) : null}
      {isExpanded &&
      !(Array.isArray(row.attractions) && row.attractions.length > 0) &&
      !(Array.isArray(row.dining) && row.dining.length > 0) &&
      row.hotel == null &&
      (desc || images.length > 0) ? (
        <p className={`${u.metaDim} mt-2`} role="status">
          {t("itin_dayNoDetail")}
        </p>
      ) : null}
      {isExpanded &&
      !desc &&
      images.length === 0 &&
      !(Array.isArray(row.attractions) && row.attractions.length > 0) &&
      !(Array.isArray(row.dining) && row.dining.length > 0) &&
      row.hotel == null &&
      row.price_note == null ? (
        <p className={`${u.metaDim} mt-2`} aria-live="polite">
          {t("order_detail_emptyDayDetail") || "No day details yet."}
        </p>
      ) : null}
    </>
  );
}
