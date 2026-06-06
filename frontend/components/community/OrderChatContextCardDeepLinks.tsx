"use client";

import Link from "next/link";
import type { OrderRow, ItineraryBlock } from "@/components/escrow/EscrowDetail/types";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import { stashEscrowOrderPrefetchFromOrderAndItinerary } from "@/lib/orderEscrowPrefetch";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

/** 三处 `onClick` 与 `itinerary` / `?? null` 分支语义须与拆前一致；641 机读见 `lib/orderEscrowPrefetch.ts` 文首。 */
type TKey = (key: string) => string;

type Props = {
  loading: boolean;
  embedded: boolean;
  fetchError: string | null;
  order: OrderRow | null;
  itinerary: ItineraryBlock | null;
  orderId: string;
  orderChatBanner: string;
  t: TKey;
};

export function OrderChatContextCardDeepLinks({
  loading,
  embedded,
  fetchError,
  order,
  itinerary,
  orderId,
  orderChatBanner,
  t,
}: Props) {
  if (loading) return null;

  return embedded ? (
    <div className={TT_COMMUNITY_FEED_ACTION.orderContextDeepLinkDivider}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          href={`/community/messages?orderId=${encodeURIComponent(orderId)}`}
          className="inline-flex min-h-[44px] items-center justify-center text-small font-medium text-ref-sun/90 hover:text-ref-sun/95 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          {t("order_messageLinkCta")} →
        </Link>
        {!fetchError && order && orderLikeMayOnchainDeposit(order) && (
          <Link
            href={`/pay?orderId=${encodeURIComponent(orderId)}`}
            onClick={() => stashEscrowOrderPrefetchFromOrderAndItinerary(orderId, order, itinerary ?? null)}
            className="inline-flex min-h-[44px] items-center justify-center text-small font-medium text-ref-sun hover:text-ref-sun/95 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
          >
            {t("orders_payHub")} →
          </Link>
        )}
      </div>
    </div>
  ) : (
    <div className="mt-3 pt-3 border-t border-ref-sun/18">
      <p className="text-small text-slate-300 mb-2">{orderChatBanner}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link
          href={`/escrow/${encodeURIComponent(orderId)}`}
          onClick={() => stashEscrowOrderPrefetchFromOrderAndItinerary(orderId, order, itinerary)}
          className="inline-flex min-h-[44px] items-center justify-center text-small font-medium text-ref-sun/90 hover:text-ref-sun/95 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          {t("community_viewOrder")} →
        </Link>
        {!fetchError && order && orderLikeMayOnchainDeposit(order) && (
          <Link
            href={`/pay?orderId=${encodeURIComponent(orderId)}`}
            onClick={() => stashEscrowOrderPrefetchFromOrderAndItinerary(orderId, order, itinerary ?? null)}
            className="inline-flex min-h-[44px] items-center justify-center text-small font-medium text-ref-sun hover:text-ref-sun/95 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
          >
            {t("orders_payHub")} →
          </Link>
        )}
      </div>
    </div>
  );
}
