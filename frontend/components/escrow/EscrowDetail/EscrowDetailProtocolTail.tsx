"use client";

import type { EscrowDetailProtocolTailProps } from "./escrowDetailProtocolTailTypes";
import { EscrowDetailProtocolTailBilateralAndMessage } from "./EscrowDetailProtocolTailBilateralAndMessage";
import { EscrowDetailProtocolTailTxModalAndEscrowCreation } from "./EscrowDetailProtocolTailTxModalAndEscrowCreation";
import { EscrowDetailProtocolTailOrderActionsEvidenceFund } from "./EscrowDetailProtocolTailOrderActionsEvidenceFund";
import { EscrowDetailProtocolTailRatingReviewChain } from "./EscrowDetailProtocolTailRatingReviewChain";
import { EscrowDetailProtocolTailFooter } from "./EscrowDetailProtocolTailFooter";

export type { EscrowDetailProtocolTailProps } from "./escrowDetailProtocolTailTypes";

export default function EscrowDetailProtocolTail({
  order,
  itinerary,
  data,
  panelClass,
  protocolPaused,
  chainOffRestConfirmCompletionEnabled,
  cancelPolicyHeadingId,
  copySummaryBusy,
  copySummaryDone,
  onCopySummary,
  stashEscrowDetailPayOrRatePrefetch,
  onTxConfirm,
  onConfirmDispute,
  onReorgRefresh,
  t,
}: EscrowDetailProtocolTailProps) {
  return (
    <>
      <EscrowDetailProtocolTailBilateralAndMessage order={order} data={data} protocolPaused={protocolPaused} />

      <EscrowDetailProtocolTailTxModalAndEscrowCreation
        order={order}
        itinerary={itinerary}
        data={data}
        panelClass={panelClass}
        protocolPaused={protocolPaused}
        onTxConfirm={onTxConfirm}
        onConfirmDispute={onConfirmDispute}
      />

      <EscrowDetailProtocolTailOrderActionsEvidenceFund
        order={order}
        data={data}
        panelClass={panelClass}
        protocolPaused={protocolPaused}
        chainOffRestConfirmCompletionEnabled={chainOffRestConfirmCompletionEnabled}
      />

      <EscrowDetailProtocolTailRatingReviewChain
        order={order}
        data={data}
        panelClass={panelClass}
        protocolPaused={protocolPaused}
        stashEscrowDetailPayOrRatePrefetch={stashEscrowDetailPayOrRatePrefetch}
        t={t}
      />

      <EscrowDetailProtocolTailFooter
        order={order}
        data={data}
        cancelPolicyHeadingId={cancelPolicyHeadingId}
        copySummaryBusy={copySummaryBusy}
        copySummaryDone={copySummaryDone}
        onCopySummary={onCopySummary}
        stashEscrowDetailPayOrRatePrefetch={stashEscrowDetailPayOrRatePrefetch}
        onReorgRefresh={onReorgRefresh}
        t={t}
      />
    </>
  );
}
