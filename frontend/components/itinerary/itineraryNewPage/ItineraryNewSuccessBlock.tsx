"use client";

import Link from "next/link";
import type { ItineraryResponse } from "@/components/itinerary/itineraryNewPage/itineraryNewTypes";
import AgreementSummaryAccordion from "@/components/itinerary/itineraryNewPage/AgreementSummaryAccordion";
import UnifiedItineraryList from "@/components/itinerary/UnifiedItineraryList";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import { TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT, TT_MARKETING_BTN_SECONDARY_CONSOLE, TT_MARKETING_BTN_WARM_OUTLINE } from "@/lib/marketingUi";

type TFunc = (key: string, vars?: LocaleInterpolationVars) => string;

export type ItineraryNewSuccessBlockProps = {
  t: TFunc;
  result: ItineraryResponse;
  itinDailyHeadingId: string;
  itinCostHeadingId: string;
  onStashEscrowPrefetch: () => void;
};

export function ItineraryNewSuccessBlock({
  t,
  result,
  itinDailyHeadingId,
  itinCostHeadingId,
  onStashEscrowPrefetch,
}: ItineraryNewSuccessBlockProps) {
  return (
    <div className="mt-12 animate-fadeUp space-y-10">
      <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-success/5 p-6" role="status">
        <p className="font-semibold text-success">{t("itin_result_title")}</p>
        <p className="mt-1 text-small text-ink-600">
          {t("itin_result_orderId")}
          <code className="rounded-[var(--radius-sm)] bg-bg-console px-1.5 py-0.5 font-mono text-meta">
            {result.order_id}
          </code>
        </p>
        <p className="text-meta text-ink-500">
          {t("itin_result_version", {
            n: result.version,
            status: result.order_status ?? result.status ?? "",
          })}
        </p>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-soft p-5 shadow-soft">
        <h2 className="text-body font-semibold text-ink-900">{t("itin_result_next_title")}</h2>
        <p className="mt-1 text-meta text-ink-600">{t("itin_result_next_sub")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/escrow/${encodeURIComponent(result.order_id)}`}
            onClick={onStashEscrowPrefetch}
            className={`${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT}`}
          >
            {t("itin_result_cta_escrow")}
          </Link>
          <Link
            href={`/pay?orderId=${encodeURIComponent(result.order_id)}`}
            onClick={onStashEscrowPrefetch}
            className={`${TT_MARKETING_BTN_WARM_OUTLINE} focus-visible:ring-offset-bg-main`}
          >
            {t("itin_result_cta_pay")}
          </Link>
          <Link
            href="/market?view=guides"
            className={`${TT_MARKETING_BTN_WARM_OUTLINE} focus-visible:ring-offset-bg-main`}
          >
            {t("itin_result_cta_market")}
          </Link>
          <Link
            href="/orders"
            className={`${TT_MARKETING_BTN_SECONDARY_CONSOLE} focus-visible:ring-offset-bg-console`}
          >
            {t("itin_result_cta_orders")}
          </Link>
        </div>
      </div>

      {result.daily_itinerary && result.daily_itinerary.length > 0 && (
        <section className="space-y-4" aria-labelledby={itinDailyHeadingId}>
          <h2 id={itinDailyHeadingId} className="text-h3 font-semibold text-ink-900">
            {t("itin_section_daily")}
          </h2>
          <UnifiedItineraryList days={result.daily_itinerary} variant="trust" t={t} />
        </section>
      )}

      {result.amount_breakdown && (
        <section
          className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-soft p-6"
          aria-labelledby={itinCostHeadingId}
        >
          <h2 id={itinCostHeadingId} className="text-body-l font-semibold text-ink-800 mb-4">
            {t("itin_section_cost")}
          </h2>
          <table className="w-full text-small text-ink-700 border-collapse" role="table">
            <tbody>
              {result.amount_breakdown.hotel != null && (
                <tr>
                  <td className="py-1 pr-4">{t("itin_hotel")}</td>
                  <td className="py-1 text-right font-medium">
                    {result.amount_breakdown.hotel}
                    {t("ui_currency_suffix_usdc")}
                  </td>
                </tr>
              )}
              {result.amount_breakdown.catering != null && (
                <tr>
                  <td className="py-1 pr-4">{t("itin_catering")}</td>
                  <td className="py-1 text-right font-medium">
                    {result.amount_breakdown.catering}
                    {t("ui_currency_suffix_usdc")}
                  </td>
                </tr>
              )}
              {result.amount_breakdown.tickets != null && (
                <tr>
                  <td className="py-1 pr-4">{t("itin_tickets")}</td>
                  <td className="py-1 text-right font-medium">
                    {result.amount_breakdown.tickets}
                    {t("ui_currency_suffix_usdc")}
                  </td>
                </tr>
              )}
              {result.amount_breakdown.guide_fee != null && (
                <tr>
                  <td className="py-1 pr-4">{t("itin_guideFee")}</td>
                  <td className="py-1 text-right font-medium">
                    {result.amount_breakdown.guide_fee}
                    {t("ui_currency_suffix_usdc")}
                  </td>
                </tr>
              )}
              {result.amount_breakdown.vehicle != null && (
                <tr>
                  <td className="py-1 pr-4">{t("itin_vehicle")}</td>
                  <td className="py-1 text-right font-medium">
                    {result.amount_breakdown.vehicle}
                    {t("ui_currency_suffix_usdc")}
                  </td>
                </tr>
              )}
              {result.amount_breakdown.platform_fee != null && (
                <tr>
                  <td className="py-1 pr-4">{t("itin_platformFee")}</td>
                  <td className="py-1 text-right font-medium">
                    {result.amount_breakdown.platform_fee}
                    {t("ui_currency_suffix_usdc")}
                  </td>
                </tr>
              )}
              {result.amount_breakdown.total_budget != null && (
                <tr className="border-t border-ink-200">
                  <td className="pt-2 pr-4 font-semibold text-ink-900">{t("escrow_totalBudget_short")}</td>
                  <td className="pt-2 text-right font-semibold text-ink-900">
                    {result.amount_breakdown.total_budget}
                    {t("ui_currency_suffix_usdc")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      <AgreementSummaryAccordion
        total={result.amount_breakdown.total_budget}
        platformFee={result.amount_breakdown.platform_fee}
        orderId={result.order_id}
      />
    </div>
  );
}
