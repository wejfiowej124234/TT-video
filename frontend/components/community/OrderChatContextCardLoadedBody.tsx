"use client";

import type { OrderRow } from "@/components/escrow/EscrowDetail/types";
import { formatDaySegment } from "@/components/landing/itineraryResultsUtils";
import { formatEvenSplitAmount } from "@/lib/itineraryEvenSplit";
import type { OrderChatContextDisplay } from "@/components/community/orderChatContextCardDerived";
import { formatOrderChatContextQuote } from "@/components/community/orderChatContextCardDerived";
import type { OrderChatContextDailyRow } from "@/components/community/orderChatContextCardTypes";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

type TKey = (key: string) => string;

type Props = {
  order: OrderRow;
  embedded: boolean;
  display: OrderChatContextDisplay;
  dash: string;
  t: TKey;
};

export function OrderChatContextCardLoadedBody({ order, embedded, display, dash, t }: Props) {
  const A = TT_COMMUNITY_FEED_ACTION;
  const {
    coverUrl,
    headline,
    travelDate,
    days,
    breakdown,
    cur,
    hasBreakdown,
    evenSplitPerDay,
    daily,
  } = display;

  return (
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
            {travelDate && (
              <span>
                {t("community_orderContext_travelDate")}: {travelDate}
              </span>
            )}
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
            {formatOrderChatContextQuote(order.amount as string | undefined, order.currency as string | undefined, dash)}
          </span>
        </p>
        {hasBreakdown && breakdown && (
          <div
            className={`mt-2 rounded-[var(--radius-md)] border px-2.5 py-2 ${embedded ? "border-slate-600/35 bg-ink-900/50" : "border-ref-sun/14 bg-ink-800/40"}`}
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
                const row = d as OrderChatContextDailyRow;
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
  );
}
