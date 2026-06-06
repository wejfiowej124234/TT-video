"use client";

import { useCallback, useRef, useState } from "react";

/** L5 订单取消确认：替代 `window.confirm`，支持 focus 回退与 busy 态 */
export function useCommunityMeOrderCancelConfirm(performCancel: (orderId: string) => Promise<void>) {
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const focusReturnRef = useRef<HTMLElement | null>(null);

  const requestCancelOrder = useCallback((orderId: string, trigger?: HTMLElement | null) => {
    focusReturnRef.current = trigger ?? null;
    setPendingOrderId(orderId);
  }, []);

  const cancelCancelOrder = useCallback(() => {
    setPendingOrderId(null);
    const prev = focusReturnRef.current;
    focusReturnRef.current = null;
    requestAnimationFrame(() => prev?.focus());
  }, []);

  const confirmCancelOrder = useCallback(async () => {
    if (!pendingOrderId || confirmBusy) return;
    const id = pendingOrderId;
    setConfirmBusy(true);
    try {
      await performCancel(id);
      setPendingOrderId(null);
      focusReturnRef.current = null;
    } finally {
      setConfirmBusy(false);
    }
  }, [pendingOrderId, confirmBusy, performCancel]);

  return {
    cancelConfirmOrderId: pendingOrderId,
    cancelConfirmBusy: confirmBusy,
    requestCancelOrder,
    cancelCancelOrder,
    confirmCancelOrder,
  };
}
