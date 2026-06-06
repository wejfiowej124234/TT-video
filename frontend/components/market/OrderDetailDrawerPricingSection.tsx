"use client";

import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import { TT_MARKETING_FOCUS_RING_DARK_SURFACE } from "@/lib/marketingUi";
import SupportedTokensPill from "@/components/trust/SupportedTokensPill";
import UnifiedItineraryList from "@/components/itinerary/UnifiedItineraryList";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  marketDetailDrawerMeta,
  marketDetailDrawerMetaList,
  marketDetailDrawerSheetSection,
  marketDetailDrawerSkeletonBlock,
  marketDetailDrawerSkeletonLine,
} from "@/components/market/marketDetailDrawerClasses";
import {
  CITY_TRANSPORT_KEYS,
  formatAmount,
  LEG_TYPE_KEYS,
  type OrderDetailItem,
} from "./orderDetailDrawerModel";
import { OrderDetailDrawerLegacyBreakdown } from "./OrderDetailDrawerLegacyBreakdown";
import type { AmountBreakdownUnified } from "@/lib/itineraryUnified";

export function OrderDetailDrawerPricingSection({
  displayOrder,
  t,
  dash,
  orderCurrency,
  loadingDetail,
  showDetailFetchError,
  detailFetchError,
  setDetailFetchRetryTick,
  itineraryDayCount,
  amountBreakdownForList,
}: {
  displayOrder: OrderDetailItem;
  t: (key: string) => string;
  dash: string;
  orderCurrency: string;
  loadingDetail: boolean;
  showDetailFetchError: boolean;
  detailFetchError: string | null;
  setDetailFetchRetryTick: Dispatch<SetStateAction<number>>;
  itineraryDayCount: number;
  amountBreakdownForList: AmountBreakdownUnified | undefined;
}) {
  return (
    <section>
      <p className={`text-body-l font-semibold text-white`}>
        {displayOrder.amount != null
          ? formatAmount(parseFloat(String(displayOrder.amount).replace(/,/g, "")), dash)
          : dash}{" "}
        {orderCurrency}
      </p>
      {Array.isArray(displayOrder.cityTransports) && displayOrder.cityTransports.length > 0 && (
        <p className={`${marketDetailDrawerMeta} mt-1`}>
          {t("order_cityTransport")}：
          {displayOrder.cityTransports
            .map((ct, i) =>
              `${t("order_dayN").replace("{{n}}", String(i + 1))} ${t(CITY_TRANSPORT_KEYS[ct] ?? "market_transportSedan")}`,
            )
            .join("、")}
        </p>
      )}
      {Array.isArray(displayOrder.transportLegs) && displayOrder.transportLegs.length > 0 && (
        <ul className={`${marketDetailDrawerMetaList} mt-1`}>
          {displayOrder.transportLegs.map((leg, i) => (
            <li key={i}>
              {t("order_interCity")}：{leg.from} → {t(LEG_TYPE_KEYS[leg.type] ?? "market_transportVehicle")} →{" "}
              {leg.to}
            </li>
          ))}
        </ul>
      )}
      {loadingDetail && !displayOrder.itinerary?.daily_itinerary?.length && (
        <div
          className="mt-3 space-y-2"
          role="status"
          aria-live="polite"
          aria-busy={true}
          aria-label={t("order_detail_loadingItinerary")}
        >
          <p className="sr-only">{t("order_detail_loadingItinerary")}</p>
          <div className={`h-3 w-36 max-w-[50%] ${marketDetailDrawerSkeletonLine}`} />
          <div className={`h-14 w-full ${marketDetailDrawerSkeletonBlock}`} />
          <div className={`h-14 w-full ${marketDetailDrawerSkeletonBlock}`} />
        </div>
      )}
      {showDetailFetchError && detailFetchError ? (
        <div className="mt-2 space-y-2">
          <ApiErrorAlert message={detailFetchError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (loadingDetail) return;
              setDetailFetchRetryTick((n) => n + 1);
            }}
          >
            <button
              type="submit"
              disabled={loadingDetail}
              aria-label={t("common_retry")}
              aria-busy={loadingDetail ? true : undefined}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-white/25 bg-white/10 px-4 py-2.5 text-small font-medium text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed ${TT_MARKETING_FOCUS_RING_DARK_SURFACE}`}
            >
              {loadingDetail ? t("common_retrying") : t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}
      {!loadingDetail &&
        displayOrder.itinerary?.daily_itinerary &&
        displayOrder.itinerary.daily_itinerary.length > 0 && (
          <div className={`mt-3 ${marketDetailDrawerSheetSection}`}>
            <h3 className="text-small font-semibold text-slate-100 mb-2">{t("order_detail_itineraryTitle")}</h3>
            <UnifiedItineraryList
              days={displayOrder.itinerary.daily_itinerary}
              amountBreakdown={amountBreakdownForList}
              currency={orderCurrency}
              collapsible={itineraryDayCount > 1}
              variant="marketDark"
              t={t}
            />
          </div>
        )}
      {!loadingDetail &&
        !displayOrder.itinerary?.daily_itinerary?.length &&
        displayOrder.breakdown &&
        (displayOrder.breakdown.guideFee != null ||
          displayOrder.breakdown.carFee != null ||
          displayOrder.breakdown.hotel != null ||
          displayOrder.breakdown.food != null ||
          displayOrder.breakdown.tickets != null) && (
          <OrderDetailDrawerLegacyBreakdown
            displayOrder={displayOrder}
            t={t}
            dash={dash}
            orderCurrency={orderCurrency}
          />
        )}
      {Array.isArray(displayOrder.highlights) && displayOrder.highlights.length > 0 && (
        <ul className="text-small text-slate-400 mt-2 list-disc list-inside space-y-0.5">
          {displayOrder.highlights.slice(0, 3).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2 mt-1">
        <SupportedTokensPill tone="dark" />
        <span className={marketDetailDrawerMeta}>{t("order_onChain")}</span>
      </div>
    </section>
  );
}
