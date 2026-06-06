"use client";

import OrderEvidenceSection from "@/components/order/OrderEvidenceSection";
import DisputeResolutionFundBlock from "./DisputeResolutionFundBlock";
import OrderActionsBlock from "./OrderActionsBlock";
import type { OrderRow } from "./types";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";
import { canViewerAcceptOrder } from "@/lib/canViewerAcceptOrder";

export function EscrowDetailProtocolTailOrderActionsEvidenceFund({
  order,
  data,
  panelClass,
  protocolPaused,
  chainOffRestConfirmCompletionEnabled,
}: {
  order: OrderRow;
  data: UseEscrowDetailResult;
  panelClass: string;
  protocolPaused: boolean;
  chainOffRestConfirmCompletionEnabled: boolean;
}) {
  if (data.isDraft) return null;
  const allowOrderAccept = canViewerAcceptOrder({
    meUserId: data.meData?.user?.id,
    meGuideRowId: data.meData?.guide?.id,
    orderTouristId: order.tourist_id ?? order.traveler_id,
    orderGuideId: order.guide_id,
  });
  return (
    <>
      <OrderActionsBlock
        orderId={String(order.id)}
        state={data.state}
        hasEscrow={data.hasEscrow}
        onSuccess={data.refreshOrder}
        guideWalletAddress={data.meData?.guide?.wallet_address ?? null}
        connectedAddress={data.connectedAddress ?? null}
        escrowAddress={order.escrow_address ?? null}
        expectedChainId={data.expectedChainId}
        disputeWindowExpired={data.disputeWindowExpired}
        variantDid
        protocolPaused={protocolPaused}
        chainOffRestConfirmCompletionEnabled={chainOffRestConfirmCompletionEnabled}
        allowAccept={allowOrderAccept}
      />

      <OrderEvidenceSection orderId={String(order.id)} panelClassName={panelClass} variantDid />

      <DisputeResolutionFundBlock
        orderId={String(order.id)}
        orderAmountStr={String(data.amount)}
        currency={String(data.currency ?? "")}
        orderState={data.state}
        variantDid
      />
    </>
  );
}
