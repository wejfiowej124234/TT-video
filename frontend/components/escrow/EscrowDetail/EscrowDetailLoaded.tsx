"use client";

/** @deprecated Runtime SSOT is `./index.tsx`. Keep in sync when refactoring EscrowDetail shell. */

import { orderStateToStatusLabelKey } from "@/lib/orderStatusI18n";
import InlineTransparencyVerification from "@/components/trust/InlineTransparencyVerification";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import OrderFlowSteps, { orderStateToStep } from "../OrderFlowSteps";
import EscrowChainMismatchActions from "./EscrowChainMismatchActions";
import EscrowDetailEscrowOverviewPanel from "./EscrowDetailEscrowOverviewPanel";
import EscrowDetailHeader from "./EscrowDetailHeader";
import EscrowDetailItineraryBudgetZone from "./EscrowDetailItineraryBudgetZone";
import EscrowDetailProtocolTail from "./EscrowDetailProtocolTail";
import type { ItineraryBlock, OrderRow } from "./types";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";
import type { EscrowDetailPageOrchestration } from "./useEscrowDetailPageOrchestration";

const EMPTY_ITINERARY: ItineraryBlock = {
  version: 1,
  snapshot_hash: null,
  daily_itinerary: [],
  amount_breakdown: undefined,
};

export interface EscrowDetailLoadedProps {
  escrowId: string;
  order: OrderRow;
  data: UseEscrowDetailResult;
  protocolPaused: boolean;
  chainOffRestConfirmCompletionEnabled: boolean;
  cancelPolicyHeadingId: string;
  orch: EscrowDetailPageOrchestration;
  t: (key: string) => string;
}

export default function EscrowDetailLoaded({
  escrowId,
  order,
  data,
  protocolPaused,
  chainOffRestConfirmCompletionEnabled,
  cancelPolicyHeadingId,
  orch,
  t,
}: EscrowDetailLoadedProps) {
  const itinerary = data.itinerary;
  const itineraryForZone = itinerary ?? EMPTY_ITINERARY;
  const showItineraryBudgetZone = Boolean(data.showItineraryBudgetZone && itinerary);

  const protocolZoneClass =
    "order-protocol-zone rounded-[var(--radius-xl)] bg-ink-950 text-slate-200 space-y-6 p-4 md:p-6";
  const panelClass =
    "rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-900/70 backdrop-blur-md shadow-scifi-panel";

  return (
    <main className="space-y-10" role="main" aria-label={t("escrow_detailAria")} data-tt-escrow-detail-page="1">
      {data.chainMismatch && (
        <div className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 p-4" role="alert">
          <p className="text-small font-semibold text-danger">{t("escrow_wrongChain")}</p>
          <p className="text-small text-slate-800 mt-0.5">
            {t("escrow_wrongChainDesc")
              .replace("{expectedChainId}", String(data.expectedChainId))
              .replace("{chainId}", String(data.chainId))}
          </p>
          <EscrowChainMismatchActions
            isConnected={data.isConnected}
            expectedChainId={data.expectedChainId}
            chainId={data.chainId}
            variantDid={false}
          />
        </div>
      )}
      {data.hasEscrow && data.disputeWindowExpired && (
        <div className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 p-4" role="alert">
          <p className="text-small font-semibold text-danger">{t("escrow_disputeWindowExpired")}</p>
          <p className="text-small text-slate-800 mt-0.5">
            {t("escrow_disputeWindowExpiredDesc").replace("{deadline}", data.disputeDeadlineAt ?? "")}
          </p>
        </div>
      )}

      <div data-zone="order-protocol" className={protocolZoneClass} role="region" aria-label={t("order_protocolZoneAria")}>
        {protocolPaused ? (
          <div
            className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 p-4 space-y-1"
            role="status"
          >
            <p className="text-small font-semibold text-warning/95">{t("escrow_protocolPause_title")}</p>
            <p className="text-small text-slate-200 leading-relaxed">{t("escrow_protocolPause_body")}</p>
          </div>
        ) : null}
        <EscrowDetailHeader
          order={order}
          state={data.state}
          hasEscrow={data.hasEscrow}
          isDraft={data.isDraft}
          escrowId={escrowId}
          chainSync={data.chainSync}
          variantDid
        />

        <TrustGrowthMomentBanner moment="first_order" surface="slate" dismissible />

        <InlineTransparencyVerification context="order" surface="slate" verificationKey={escrowId} />

        <div id="escrow-after-final-plan" className="scroll-mt-24 outline-none" tabIndex={-1}>
          <OrderFlowSteps
            currentStep={orderStateToStep(order)}
            statusLabel={t(orderStateToStatusLabelKey(order))}
            variant="did"
          />
        </div>

        <EscrowDetailItineraryBudgetZone
          escrowId={escrowId}
          order={order}
          itinerary={itineraryForZone}
          amount={data.amount}
          currency={data.currency}
          snapshotHash={data.snapshotHash}
          allowConfirmFinalPlan={data.allowConfirmFinalPlan}
          isDraft={data.isDraft}
          state={data.state}
          showItineraryBudgetZone={showItineraryBudgetZone}
          panelClass={panelClass}
          protocolPaused={protocolPaused}
          savingItinerary={orch.savingItinerary}
          patchItineraryError={orch.patchItineraryError}
          patchItinerarySuccess={orch.patchItinerarySuccess}
          deleteOrderPending={orch.deleteOrderPending}
          deleteOrderError={orch.deleteOrderError}
          canPatchItinerary={orch.canPatchItinerary}
          showDraftDayEditor={orch.showDraftDayEditor}
          showCityEditor={orch.showCityEditor}
          cityOptions={orch.cityOptions}
          draftRowsAligned={orch.draftRowsAligned}
          draftDailyItinerary={orch.draftDailyItinerary}
          rowsFromApi={orch.rowsFromApi}
          itineraryListDays={orch.itineraryListDays}
          setDraftDailyItinerary={orch.setDraftDailyItinerary}
          chatOrderContextInline={orch.chatOrderContextInline}
          onSaveItinerary={orch.handleSaveItinerary}
          onDeleteOrder={orch.submitDeleteOrder}
          onConfirmFinalPlanSuccess={orch.onConfirmFinalPlanSuccess}
          t={t}
        />

        <EscrowDetailEscrowOverviewPanel order={order} data={data} panelClass={panelClass} t={t} />

        <EscrowDetailProtocolTail
          order={order}
          itinerary={itinerary}
          data={data}
          panelClass={panelClass}
          protocolPaused={protocolPaused}
          chainOffRestConfirmCompletionEnabled={chainOffRestConfirmCompletionEnabled}
          cancelPolicyHeadingId={cancelPolicyHeadingId}
          copySummaryBusy={orch.copySummaryBusy}
          copySummaryDone={orch.copySummaryDone}
          onCopySummary={orch.handleCopySummary}
          stashEscrowDetailPayOrRatePrefetch={orch.stashEscrowDetailPayOrRatePrefetch}
          onTxConfirm={() => orch.handleTxConfirm(protocolPaused)}
          onConfirmDispute={(h) => orch.handleConfirmDispute(protocolPaused, h)}
          onReorgRefresh={orch.handleReorgRefresh}
          t={t}
        />
      </div>
    </main>
  );
}
