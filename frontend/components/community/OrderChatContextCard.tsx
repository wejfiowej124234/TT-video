"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { getOrder } from "@/lib/apiClient/orders";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { OrderResponse, OrderRow, ItineraryBlock } from "@/components/escrow/EscrowDetail/types";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import {
  formatDaySegment,
  getFirstDayImage,
  type DailyItemForSummary,
} from "@/components/landing/itineraryResultsUtils";
import type { AmountBreakdownDisplay } from "@/components/escrow/EscrowDetail/QuoteSummaryCard";
import { stashEscrowOrderPrefetchFromOrderAndItinerary } from "@/lib/orderEscrowPrefetch";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { formatEvenSplitAmount, resolveEvenSplitPerDay } from "@/lib/itineraryEvenSplit";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

type DailyRow = NonNullable<ItineraryBlock["daily_itinerary"]>[number] & {
  city?: string;
  description?: string;
  content_text?: string;
};

function formatQuote(amount: string | undefined, currency: string | undefined, dash: string): string {
  if (amount == null || amount === "") return dash;
  const cur = (currency ?? "").trim();
  return cur ? `${amount} ${cur}` : amount;
}

export type OrderChatContextCardLayout = "community-page" | "escrow-embedded";

/** 53-S7：从订单详情「前往 TT 社区消息」带 ?orderId= 时，展示与 04 GET order 一致的只读行程/报价摘要。
 * `escrow-embedded`：Escrow 协议区内嵌，与 30-DID 面板同色系；不展示「返回 Escrow」链（当前页即 Escrow）。
 */
export default function OrderChatContextCard({
  orderId,
  variantLayout = "community-page",
  /** 与 `orderId` 一致时跳过首次 `getOrder`（如 Escrow 页已由 `useEscrowDetail` 拉取）；点「重试」后仍走网络 */
  inlineSnapshot,
}: {
  orderId: string;
  variantLayout?: OrderChatContextCardLayout;
  inlineSnapshot?: { order: OrderRow; itinerary: ItineraryBlock | null } | null;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  const dash = t("ui_em_dash");
  const embedded = variantLayout === "escrow-embedded";
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryBlock | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const retryOrderContext = useCallback(() => setRetryKey((k) => k + 1), []);

  useEffect(() => {
    const snap = inlineSnapshot;
    const idMatch =
      retryKey === 0 &&
      snap?.order?.id != null &&
      String(snap.order.id).trim() === String(orderId).trim();
    if (idMatch) {
      setOrder(snap.order);
      setItinerary(snap.itinerary ?? null);
      setFetchError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    getOrder(orderId)
      .then((raw: unknown) => {
        if (cancelled) return;
        const res = raw as OrderResponse;
        const o = res?.order ?? (raw as OrderRow);
        setOrder(o?.id ? o : null);
        setItinerary(res?.itinerary ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("OrderChatContextCard:", err);
          }
          setOrder(null);
          setItinerary(null);
          setFetchError(mapApiReadError(err, t, "community_orderContext_loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, t, retryKey, inlineSnapshot]);

  const daily = itinerary?.daily_itinerary as DailyRow[] | undefined;
  const dailyForImage = daily as DailyItemForSummary[] | undefined;
  const orderImage = typeof order?.image === "string" && order.image ? order.image : null;
  const coverUrl = orderImage ?? getFirstDayImage(dailyForImage);
  const destination = (order?.destination as string | undefined) ?? "";
  const city = (order?.city as string | undefined) ?? "";
  const travelDate = (order?.travel_date as string | undefined) ?? "";
  const days = order?.days != null ? String(order.days) : "";
  const headline = [destination, city].filter(Boolean).join(" · ") || t("community_orderContext_noHeadline");
  const breakdown = itinerary?.amount_breakdown as AmountBreakdownDisplay | undefined;
  const cur = (order?.currency as string | undefined)?.trim() ?? "";
  const dailyCount = daily?.length ?? 0;
  const evenSplitPerDay = resolveEvenSplitPerDay(breakdown?.total_budget, dailyCount);
  const hasBreakdown =
    !!breakdown &&
    [
      breakdown.hotel,
      breakdown.catering,
      breakdown.tickets,
      breakdown.guide_fee,
      breakdown.vehicle,
      breakdown.platform_fee,
      breakdown.total_budget,
    ].some((v) => v != null);

  const A = TT_COMMUNITY_FEED_ACTION;
  const shellClass = embedded ? A.orderContextShellEmbedded : A.orderContextShell;

  return (
    <div className={shellClass} role="region" aria-labelledby={headingId}>
      <h2 id={headingId} className={`text-small font-semibold mb-1 ${embedded ? "text-slate-200" : "text-ref-sun"}`}>
        {t("community_orderContext_title")}
      </h2>
      <p className={`text-meta ${embedded ? "text-slate-300 mb-2" : "text-slate-400 mb-3"}`}>{t("community_orderContext_readOnly")}</p>

      {loading ? (
        <div
          className="flex flex-col sm:flex-row gap-3 animate-pulse motion-reduce:animate-none"
          role="status"
          aria-busy="true"
          aria-label={t("common_loading")}
        >
          <div
            className={embedded ? A.orderContextSkeletonMediaEmbedded : A.orderContextSkeletonMedia}
          />
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <div className={`h-4 ${A.orderContextSkeletonBar} w-4/5 max-w-xs`} />
            <div className={`h-3 ${A.orderContextSkeletonBar} w-3/5 max-w-[14rem]`} />
            <div className={`h-3 ${A.orderContextSkeletonBar} w-full max-w-md`} />
          </div>
        </div>
      ) : fetchError ? (
        <div className="space-y-2" role="alert" aria-live="polite">
          {!embedded ? <p className="text-small text-slate-300">{t("community_orderChatBanner")}</p> : null}
          <ApiErrorAlert message={fetchError} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              retryOrderContext();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : !order ? (
        <p className="text-small text-slate-300">{t("community_orderContext_noDetails")}</p>
      ) : (
        <div className="flex gap-3 flex-col sm:flex-row sm:items-start">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 订单封面域任意 HTTPS，避免 remotePatterns 未配置
            <img
              src={coverUrl}
              alt=""
              className={`w-full sm:w-28 h-36 sm:h-20 object-cover rounded-[var(--radius-md)] shrink-0 bg-ink-800 ${embedded ? "border border-ref-sun/16" : "border border-ref-sun/18"}`}
            />
          ) : null}
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-body font-medium text-slate-100 truncate" title={headline}>
              {headline}
            </p>
            {(travelDate || days) && (
              <p className="text-small text-slate-300">
                {travelDate && <span>{t("community_orderContext_travelDate")}: {travelDate}</span>}
                {travelDate && days ? <span className="mx-1.5">·</span> : null}
                {days ? (
                  <span>
                    {t("community_orderContext_days")}: {days}
                  </span>
                ) : null}
              </p>
            )}
            <p className="text-small text-slate-300">
              <span className="text-slate-400">{t("community_orderContext_total")}: </span>
              <span className="font-medium text-ref-sun/95 tabular-nums">
                {formatQuote(order.amount as string | undefined, order.currency as string | undefined, dash)}
              </span>
            </p>
            {hasBreakdown && breakdown && (
              <div
                className={embedded ? A.orderContextBreakdownEmbedded : A.orderContextBreakdown}
              >
                <p className="text-meta font-medium text-slate-300 mb-1">{t("community_orderContext_breakdown")}</p>
                <ul className="text-meta text-slate-300 list-disc pl-4 space-y-0.5" role="list">
                  {breakdown.hotel != null && (
                    <li>
                      {t("escrow_hotel")} {breakdown.hotel} {cur}
                    </li>
                  )}
                  {breakdown.catering != null && (
                    <li>
                      {t("escrow_catering")} {breakdown.catering} {cur}
                    </li>
                  )}
                  {breakdown.tickets != null && (
                    <li>
                      {t("escrow_tickets")} {breakdown.tickets} {cur}
                    </li>
                  )}
                  {breakdown.guide_fee != null && (
                    <li>
                      {t("escrow_guideFee")} {breakdown.guide_fee} {cur}
                    </li>
                  )}
                  {breakdown.vehicle != null && (
                    <li>
                      {t("escrow_vehicle")} {breakdown.vehicle} {cur}
                    </li>
                  )}
                  {breakdown.platform_fee != null && (
                    <li>
                      {t("escrow_platformFee")} {breakdown.platform_fee} {cur}
                    </li>
                  )}
                  {breakdown.total_budget != null && (
                    <li className="font-medium text-slate-300 pt-0.5 border-t border-ref-sun/10 mt-0.5">
                      {t("escrow_totalBudget")} {breakdown.total_budget} {cur}
                    </li>
                  )}
                </ul>
              </div>
            )}
            {daily && daily.length > 0 ? (
              <div className={`mt-2 pt-2 ${embedded ? A.orderContextDividerEmbedded : A.orderContextDivider}`}>
                <p className="text-meta font-medium text-slate-300 mb-1">{t("community_orderContext_itineraryOutline")}</p>
                <ul
                  className="text-meta text-slate-300 list-disc pl-4 space-y-0.5 max-h-36 overflow-y-auto pr-1"
                  aria-label={t("community_orderContext_itineraryDays")}
                >
                  {daily.slice(0, 5).map((d, i) => {
                    const row = d as DailyRow;
                    const city = typeof row.city === "string" ? row.city.trim() : "";
                    const seg = formatDaySegment(i + 1, city || dash, t);
                    const desc = (row.description ?? row.content_text ?? "").trim().slice(0, 100);
                    return (
                      <li key={i} className="break-words" title={desc ? `${seg} — ${desc}` : seg}>
                        <span className="text-slate-300">{seg}</span>
                        {desc ? <span className="text-slate-400"> — {desc}</span> : null}
                      </li>
                    );
                  })}
                </ul>
                {evenSplitPerDay != null && (
                  <p className="text-meta text-slate-400 mt-1.5" role="note">
                    <span className="text-slate-300">{t("itin_dayCostEvenSplitLabel")}: </span>
                    <span className="tabular-nums text-slate-300">
                      {formatEvenSplitAmount(evenSplitPerDay)} {cur}
                    </span>
                    <span className="text-slate-500"> {t("itin_dayCostEvenSplitHint")}</span>
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {!loading &&
        (embedded ? (
        <div className={A.orderContextDeepLinkDivider}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`/community/messages?orderId=${encodeURIComponent(orderId)}`}
              className="inline-flex min-h-[44px] items-center justify-center text-small font-medium text-ref-sun/90 hover:text-ref-sun/95 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {t("order_messageLinkCta")} →
            </Link>
            {!fetchError && order && orderLikeMayOnchainDeposit(order) && (
              <Link
                href={`/pay?orderId=${encodeURIComponent(orderId)}`}
                onClick={() => stashEscrowOrderPrefetchFromOrderAndItinerary(orderId, order, itinerary ?? null)}
                className="inline-flex min-h-[44px] items-center justify-center text-small font-medium text-ref-sun hover:text-ref-sun/95 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {t("orders_payHub")} →
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-ref-sun/18">
          <p className="text-small text-slate-300 mb-2">{t("community_orderChatBanner")}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href={`/escrow/${encodeURIComponent(orderId)}`}
              onClick={() => stashEscrowOrderPrefetchFromOrderAndItinerary(orderId, order, itinerary)}
              className="inline-flex min-h-[44px] items-center justify-center text-small font-medium text-ref-sun/90 hover:text-ref-sun/95 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {t("community_viewOrder")} →
            </Link>
            {!fetchError && order && orderLikeMayOnchainDeposit(order) && (
              <Link
                href={`/pay?orderId=${encodeURIComponent(orderId)}`}
                onClick={() => stashEscrowOrderPrefetchFromOrderAndItinerary(orderId, order, itinerary ?? null)}
                className="inline-flex min-h-[44px] items-center justify-center text-small font-medium text-ref-sun hover:text-ref-sun/95 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {t("orders_payHub")} →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
