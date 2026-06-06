"use client";

import OrderMessageLink from "./OrderMessageLink";
import type { EscrowDetailItineraryBudgetZoneProps } from "./escrowDetailItineraryBudgetZoneTypes";
import { EscrowDetailItineraryBudgetZoneLockedPanel } from "./EscrowDetailItineraryBudgetZoneLockedPanel";
import { EscrowDetailItineraryBudgetZoneToolbar } from "./EscrowDetailItineraryBudgetZoneToolbar";
import { EscrowDetailItineraryBudgetZoneDraftEditors } from "./EscrowDetailItineraryBudgetZoneDraftEditors";
import { EscrowDetailItineraryBudgetZoneItineraryChatQuoteGrid } from "./EscrowDetailItineraryBudgetZoneItineraryChatQuoteGrid";

export type { EscrowDetailItineraryBudgetZoneProps } from "./escrowDetailItineraryBudgetZoneTypes";

export default function EscrowDetailItineraryBudgetZone(props: EscrowDetailItineraryBudgetZoneProps) {
  const {
    escrowId,
    order,
    itinerary,
    amount,
    currency,
    snapshotHash,
    allowConfirmFinalPlan,
    isDraft,
    state,
    showItineraryBudgetZone,
    panelClass,
    protocolPaused,
    savingItinerary,
    patchItineraryError,
    patchItinerarySuccess,
    deleteOrderPending,
    deleteOrderError,
    canPatchItinerary,
    showDraftDayEditor,
    showCityEditor,
    cityOptions,
    draftRowsAligned,
    draftDailyItinerary,
    rowsFromApi,
    itineraryListDays,
    setDraftDailyItinerary,
    chatOrderContextInline,
    onSaveItinerary,
    onDeleteOrder,
    onConfirmFinalPlanSuccess,
    t,
  } = props;

  if (showItineraryBudgetZone) {
    return (
      <div className={`${panelClass} p-6 space-y-4`}>
        <EscrowDetailItineraryBudgetZoneToolbar
          order={order}
          state={state}
          isDraft={isDraft}
          canPatchItinerary={canPatchItinerary}
          savingItinerary={savingItinerary}
          onSaveItinerary={onSaveItinerary}
          deleteOrderPending={deleteOrderPending}
          deleteOrderError={deleteOrderError}
          patchItineraryError={patchItineraryError}
          patchItinerarySuccess={patchItinerarySuccess}
          onDeleteOrder={onDeleteOrder}
          t={t}
        />
        <OrderMessageLink orderId={String(order.id)} variantDid compact />
        <EscrowDetailItineraryBudgetZoneDraftEditors
          escrowId={escrowId}
          showCityEditor={showCityEditor}
          showDraftDayEditor={showDraftDayEditor}
          cityOptions={cityOptions}
          draftRowsAligned={draftRowsAligned}
          draftDailyItinerary={draftDailyItinerary}
          rowsFromApi={rowsFromApi}
          setDraftDailyItinerary={setDraftDailyItinerary}
          destination={String(order.destination ?? "").trim()}
          t={t}
        />
        <EscrowDetailItineraryBudgetZoneItineraryChatQuoteGrid
          itineraryListDays={itineraryListDays}
          order={order}
          chatOrderContextInline={chatOrderContextInline}
          itinerary={itinerary}
          amount={amount}
          currency={currency}
          snapshotHash={snapshotHash}
          allowConfirmFinalPlan={allowConfirmFinalPlan}
          onConfirmFinalPlanSuccess={onConfirmFinalPlanSuccess}
          protocolPaused={protocolPaused}
          t={t}
        />
      </div>
    );
  }

  return <EscrowDetailItineraryBudgetZoneLockedPanel panelClass={panelClass} t={t} />;
}
