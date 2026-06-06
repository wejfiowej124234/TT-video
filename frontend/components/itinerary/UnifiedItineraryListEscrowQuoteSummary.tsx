"use client";

import type { AmountBreakdownUnified } from "@/lib/itineraryUnified";
import { formatUnifiedItineraryAmount, UNIFIED_ITINERARY_AMOUNT_KEYS } from "./unifiedItineraryListConstants";
import type { UnifiedItineraryListChrome } from "./unifiedItineraryListChrome";

export type UnifiedItineraryListEscrowQuoteSummaryProps = {
  amountBreakdown: AmountBreakdownUnified;
  cardClass: string;
  dash: string;
  displayCurrency: string;
  t: (k: string) => string;
  u: UnifiedItineraryListChrome;
};

export default function UnifiedItineraryListEscrowQuoteSummary({
  amountBreakdown,
  cardClass,
  dash,
  displayCurrency,
  t,
  u,
}: UnifiedItineraryListEscrowQuoteSummaryProps) {
  return (
    <div className={cardClass}>
      <h4 className={u.quoteHeading}>{t("escrow_quoteSummary")}</h4>
      <ul className={u.quoteList} role="list">
        {UNIFIED_ITINERARY_AMOUNT_KEYS.map(({ key, i18n }) => {
          const v = amountBreakdown[key as keyof AmountBreakdownUnified];
          if (v == null) return null;
          return (
            <li key={key}>
              {t(i18n)} {formatUnifiedItineraryAmount(v, dash)} {displayCurrency}
            </li>
          );
        })}
        {amountBreakdown.total_budget != null ? (
          <li className={u.quoteTotal}>
            {t("escrow_totalBudget")} {formatUnifiedItineraryAmount(amountBreakdown.total_budget, dash)} {displayCurrency}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
