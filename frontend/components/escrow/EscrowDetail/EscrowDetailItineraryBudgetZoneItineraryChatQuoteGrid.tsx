"use client";

import UnifiedItineraryList from "@/components/itinerary/UnifiedItineraryList";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import ChatBlock from "./ChatBlock";
import QuoteSummaryCard from "./QuoteSummaryCard";
import type { ItineraryBlock, OrderRow } from "./types";

export function EscrowDetailItineraryBudgetZoneItineraryChatQuoteGrid({
  itineraryListDays,
  order,
  chatOrderContextInline,
  itinerary,
  amount,
  currency,
  snapshotHash,
  allowConfirmFinalPlan,
  onConfirmFinalPlanSuccess,
  protocolPaused,
  t,
}: {
  itineraryListDays: UnifiedDayRow[];
  order: OrderRow;
  chatOrderContextInline: { order: OrderRow; itinerary: ItineraryBlock | null } | null;
  itinerary: ItineraryBlock;
  amount: string;
  currency: string;
  snapshotHash: string | null;
  allowConfirmFinalPlan: boolean;
  onConfirmFinalPlanSuccess: () => void;
  protocolPaused: boolean;
  t: (key: string) => string;
}) {
  return (
    <>
      {itineraryListDays.length > 0 && <UnifiedItineraryList days={itineraryListDays} variant="did" t={t} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        <div className="lg:col-span-2">
          <ChatBlock orderId={String(order.id)} variant="did" orderContextInline={chatOrderContextInline} />
        </div>
        <div className="lg:col-span-1">
          <QuoteSummaryCard
            amount={amount}
            currency={currency}
            amountBreakdown={itinerary.amount_breakdown ?? null}
            version={itinerary.version}
            snapshotHash={snapshotHash}
            orderId={String(order.id)}
            allowConfirmFinalPlan={allowConfirmFinalPlan}
            onConfirmed={onConfirmFinalPlanSuccess}
            variantDid
            protocolPaused={protocolPaused}
          />
        </div>
      </div>
    </>
  );
}
