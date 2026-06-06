import type { OrderRow, ItineraryBlock } from "@/components/escrow/EscrowDetail/types";
import type { AmountBreakdownDisplay } from "@/components/escrow/EscrowDetail/QuoteSummaryCard";
import {
  getFirstDayImage,
  type DailyItemForSummary,
} from "@/components/landing/itineraryResultsUtils";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import { resolveEvenSplitPerDay } from "@/lib/itineraryEvenSplit";
import type { OrderChatContextDailyRow } from "@/components/community/orderChatContextCardTypes";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

export function formatOrderChatContextQuote(
  amount: string | undefined,
  currency: string | undefined,
  dash: string,
): string {
  if (amount == null || amount === "") return dash;
  const cur = (currency ?? "").trim();
  return cur ? `${amount} ${cur}` : amount;
}

export type OrderChatContextDisplay = {
  shellClass: string;
  coverUrl: string;
  headline: string;
  travelDate: string;
  days: string;
  breakdown: AmountBreakdownDisplay | undefined;
  cur: string;
  hasBreakdown: boolean;
  evenSplitPerDay: number | null;
  daily: OrderChatContextDailyRow[] | undefined;
};

export function computeOrderChatContextDisplay(
  order: OrderRow | null,
  itinerary: ItineraryBlock | null,
  opts: { embedded: boolean; noHeadlineLabel: string },
): OrderChatContextDisplay {
  const { embedded, noHeadlineLabel } = opts;
  const daily = itinerary?.daily_itinerary as OrderChatContextDailyRow[] | undefined;
  const dailyForImage = daily as DailyItemForSummary[] | undefined;
  const orderImage = typeof order?.image === "string" && order.image ? order.image : null;
  const coverUrlRaw = orderImage ?? getFirstDayImage(dailyForImage);
  const coverUrl =
    coverUrlRaw != null && String(coverUrlRaw).trim()
      ? communityMediaAbsoluteUrlForRender(String(coverUrlRaw).trim())
      : "";
  const destination = (order?.destination as string | undefined) ?? "";
  const travelDate = (order?.travel_date as string | undefined) ?? "";
  const days = order?.days != null ? String(order.days) : "";
  const headline =
    [destination, (order?.city as string | undefined) ?? ""].filter(Boolean).join(" · ") || noHeadlineLabel;
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

  const shellClass = embedded
    ? TT_COMMUNITY_FEED_ACTION.orderContextShellEmbedded
    : TT_COMMUNITY_FEED_ACTION.orderContextShell;

  return {
    shellClass,
    coverUrl,
    headline,
    travelDate,
    days,
    breakdown,
    cur,
    hasBreakdown,
    evenSplitPerDay,
    daily,
  };
}
