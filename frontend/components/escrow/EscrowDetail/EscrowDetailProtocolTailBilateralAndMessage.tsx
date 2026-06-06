"use client";

import OrderMessageLink from "./OrderMessageLink";
import type { OrderRow } from "./types";
import { orderStateToStep } from "../OrderFlowSteps";
import BilateralConfirmBlock from "./BilateralConfirmBlock";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";

export function EscrowDetailProtocolTailBilateralAndMessage({
  order,
  data,
  protocolPaused,
}: {
  order: OrderRow;
  data: Pick<UseEscrowDetailResult, "hasEscrow" | "meData" | "showItineraryBudgetZone" | "refreshOrder">;
  protocolPaused: boolean;
}) {
  return (
    <>
      {orderStateToStep(order) === 3 && !data.hasEscrow && (
        <BilateralConfirmBlock
          orderId={String(order.id)}
          isGuide={!!data.meData?.guide}
          touristConfirmed={(order as OrderRow & { tourist_confirmed?: boolean }).tourist_confirmed}
          guideConfirmed={(order as OrderRow & { guide_confirmed?: boolean }).guide_confirmed}
          onSuccess={data.refreshOrder}
          variantDid
          protocolPaused={protocolPaused}
        />
      )}

      {!data.showItineraryBudgetZone && [2, 3, 4].includes(orderStateToStep(order)) && (
        <OrderMessageLink orderId={String(order.id)} variantDid />
      )}
    </>
  );
}
