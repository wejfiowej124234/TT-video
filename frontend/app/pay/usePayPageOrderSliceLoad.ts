"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrderResponse } from "@/components/escrow/EscrowDetail/types";
import { getOrder } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { stashEscrowOrderPrefetchForPayHubEscrowNav } from "@/lib/orderEscrowPrefetch";
import type { PayDeadlineOrderSlice } from "@/lib/payOrderDeadlineHints";
import { apiOrderSliceMatchesRoute } from "@/lib/orderGetEnvelopeGuard";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import { PAY_ORDER_ID_UUID_RE } from "@/lib/payOrderIdSource";

type PayRouter = { replace: (href: string, opts?: { scroll?: boolean }) => void };

export type UsePayPageOrderSliceLoadArgs = {
  effectiveOrderId: string;
  orderFetchTick: number;
  payLoginReturnPath: string;
  router: PayRouter;
  t: (key: string) => string;
  bumpOrderFetch: () => void;
};

export function usePayPageOrderSliceLoad({
  effectiveOrderId,
  orderFetchTick,
  payLoginReturnPath,
  router,
  t,
  bumpOrderFetch,
}: UsePayPageOrderSliceLoadArgs) {
  const [payDeadlineHints, setPayDeadlineHints] = useState<PayDeadlineOrderSlice | null>(null);
  const [orderResponseForEscrowPrefetch, setOrderResponseForEscrowPrefetch] = useState<OrderResponse | null>(
    null,
  );
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null);
  const [payOrderForbidden, setPayOrderForbidden] = useState(false);

  useEffect(() => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      setPayDeadlineHints(null);
      setOrderResponseForEscrowPrefetch(null);
      setOrderLoadError(null);
      setPayOrderForbidden(false);
      return;
    }
    setOrderLoadError(null);
    setPayOrderForbidden(false);
    setPayDeadlineHints(null);
    setOrderResponseForEscrowPrefetch(null);
    let cancelled = false;
    getOrder(effectiveOrderId)
      .then((res) => {
        if (cancelled) return;
        const data = res as OrderResponse & { order?: PayDeadlineOrderSlice };
        setOrderResponseForEscrowPrefetch(data);
        const o = data?.order;
        if (!o) {
          setPayDeadlineHints(null);
          setOrderResponseForEscrowPrefetch(null);
          setOrderLoadError(t("pay_orderSliceMissing"));
          return;
        }
        if (!apiOrderSliceMatchesRoute(o, effectiveOrderId)) {
          setPayDeadlineHints(null);
          setOrderResponseForEscrowPrefetch(null);
          setOrderLoadError(t("orderGet_payloadOrderMismatch"));
          return;
        }
        setPayDeadlineHints({
          chat_confirm_deadline: o.chat_confirm_deadline,
          payment_deadline: o.payment_deadline,
          state: o.state,
          sub_status: o.sub_status,
          status: o.status,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof Error && err.message === "login_required") {
            setPayOrderForbidden(false);
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(payLoginReturnPath)}`);
            return;
          }
          if (err instanceof Error && err.message === "forbidden") {
            if (typeof window !== "undefined") {
              console.error("PayPage getOrder:", err);
            }
            setPayDeadlineHints(null);
            setOrderResponseForEscrowPrefetch(null);
            setPayOrderForbidden(true);
            setOrderLoadError(t("pay_orderForbidden_body"));
            return;
          }
          if (typeof window !== "undefined") {
            console.error("PayPage getOrder:", err);
          }
          setPayDeadlineHints(null);
          setOrderResponseForEscrowPrefetch(null);
          setPayOrderForbidden(false);
          setOrderLoadError(mapApiReadError(err, t, "pay_orderLoadFailed"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveOrderId, orderFetchTick, payLoginReturnPath, router, t]);

  const stashEscrowNavPrefetch = useCallback(() => {
    const id = effectiveOrderId;
    if (!PAY_ORDER_ID_UUID_RE.test(id)) return;
    stashEscrowOrderPrefetchForPayHubEscrowNav(id, orderResponseForEscrowPrefetch);
  }, [effectiveOrderId, orderResponseForEscrowPrefetch]);

  const orderRow = orderResponseForEscrowPrefetch?.order ?? null;
  const orderLoadedOk =
    PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) && orderRow != null && orderLoadError == null;
  const mayOnchainDeposit = orderLoadedOk && orderLikeMayOnchainDeposit(orderRow);
  const emphasizeEscrowHub = orderLoadedOk && !mayOnchainDeposit;
  const awaitingOrderSlice =
    PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) && orderLoadError == null && orderRow == null;

  const onRetryOrderFetch = useCallback(() => {
    setOrderLoadError(null);
    setPayOrderForbidden(false);
    setPayDeadlineHints(null);
    setOrderResponseForEscrowPrefetch(null);
    bumpOrderFetch();
  }, [bumpOrderFetch]);

  return {
    payDeadlineHints,
    orderResponseForEscrowPrefetch,
    orderLoadError,
    payOrderForbidden,
    stashEscrowNavPrefetch,
    orderRow,
    orderLoadedOk,
    mayOnchainDeposit,
    emphasizeEscrowHub,
    awaitingOrderSlice,
    onRetryOrderFetch,
  };
}
