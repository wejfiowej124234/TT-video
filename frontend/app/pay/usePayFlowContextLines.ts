"use client";

import { useMemo } from "react";
import type { OrderFlowStep } from "@/components/escrow/OrderFlowSteps";
import type { OrderResponse } from "@/components/escrow/EscrowDetail/types";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import { PAY_ORDER_ID_UUID_RE } from "@/lib/payOrderIdSource";
import type { PayDeadlineOrderSlice } from "@/lib/payOrderDeadlineHints";
import { PAY_ORDER_FLOW_STEP_LABEL_KEYS } from "./payPageConstants";

type TLike = (key: string, opts?: Record<string, string | number>) => string;

export function usePayFlowContextLines(args: {
  t: TLike;
  effectiveOrderId: string;
  payDeadlineHints: PayDeadlineOrderSlice | null;
  orderLoadError: string | null;
  payOrderForbidden: boolean;
  payOrderFlowStep: OrderFlowStep;
  orderResponseForEscrowPrefetch: OrderResponse | null;
}) {
  const {
    t,
    effectiveOrderId,
    payDeadlineHints,
    orderLoadError,
    payOrderForbidden,
    payOrderFlowStep,
    orderResponseForEscrowPrefetch,
  } = args;

  const payFlowBandAria = useMemo(() => {
    if (orderLoadError != null && PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      return payOrderForbidden ? t("pay_flowBandAria_orderForbidden") : t("pay_flowBandAria_orderLoadError");
    }
    if (payDeadlineHints == null) {
      if (PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) && orderLoadError == null) {
        return t("pay_flowBandAria_waitingForOrder");
      }
      return t("pay_flowBandAria_untilResolved");
    }
    const flowOrder = orderResponseForEscrowPrefetch?.order;
    if (flowOrder != null && !orderLikeMayOnchainDeposit(flowOrder)) {
      return t("pay_flowBandAria_escrowPhase");
    }
    const labelKey = PAY_ORDER_FLOW_STEP_LABEL_KEYS[payOrderFlowStep - 1];
    return t("pay_flowBandAria_fromOrder", { step: payOrderFlowStep, label: t(labelKey) });
  }, [
    orderLoadError,
    payDeadlineHints,
    payOrderFlowStep,
    effectiveOrderId,
    orderResponseForEscrowPrefetch,
    payOrderForbidden,
    t,
  ]);

  const payFlowContextText = useMemo(() => {
    if (orderLoadError != null && PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      return payOrderForbidden ? t("pay_flowContext_orderForbidden") : t("pay_flowContext_orderLoadError");
    }
    if (payDeadlineHints == null) {
      if (PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) && orderLoadError == null) {
        return t("pay_flowContext_waitingForOrder");
      }
      return t("pay_flowContext_untilResolved");
    }
    const orderForFlow = orderResponseForEscrowPrefetch?.order;
    if (orderForFlow != null && !orderLikeMayOnchainDeposit(orderForFlow)) {
      return t("pay_flowContext_escrowPhaseHub");
    }
    const labelKey = PAY_ORDER_FLOW_STEP_LABEL_KEYS[payOrderFlowStep - 1];
    return t("pay_flowContext_fromOrder", { step: payOrderFlowStep, label: t(labelKey) });
  }, [
    orderLoadError,
    payDeadlineHints,
    payOrderFlowStep,
    effectiveOrderId,
    orderResponseForEscrowPrefetch,
    payOrderForbidden,
    t,
  ]);

  return { payFlowBandAria, payFlowContextText };
}
