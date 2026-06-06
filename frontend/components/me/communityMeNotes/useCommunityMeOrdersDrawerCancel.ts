"use client";

import { useCallback, useState } from "react";
import type { OrderListItem } from "@/lib/apiClient";
import { getIdempotencyKey, orderCancel } from "@/lib/apiClient";
import { orderListItemMayRequestCancel } from "@/lib/communityMeMyOrdersModel";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { useCommunityMeOrderCancelConfirm } from "@/components/community/useCommunityMeOrderCancelConfirm";

/** 订单方格弹层：L5 取消确认 + API 调用（Hub drawer） */
export function useCommunityMeOrdersDrawerCancel(
  orders: readonly OrderListItem[],
  t: LocaleTranslateFn,
  onOrderCancelled: (id: string) => void,
  onNotify: (message: string) => void,
) {
  const [cancelApiBusyId, setCancelApiBusyId] = useState<string | null>(null);

  const performCancel = useCallback(
    async (orderId: string) => {
      const item = orders.find((o) => String(o.id) === orderId);
      if (!item || !orderListItemMayRequestCancel(item)) {
        onNotify(t("community_me_orders_cancel_unavailable"));
        return;
      }
      setCancelApiBusyId(orderId);
      try {
        await orderCancel(orderId, getIdempotencyKey());
        onOrderCancelled(orderId);
      } catch (e) {
        onNotify(mapApiReadError(e, t, "orders_requestFailed"));
      } finally {
        setCancelApiBusyId(null);
      }
    },
    [orders, t, onNotify, onOrderCancelled],
  );

  const {
    cancelConfirmOrderId,
    cancelConfirmBusy,
    requestCancelOrder,
    cancelCancelOrder,
    confirmCancelOrder,
  } = useCommunityMeOrderCancelConfirm(performCancel);

  const onRequestCancel = useCallback(
    (orderId: string, trigger?: HTMLElement | null) => {
      const item = orders.find((o) => String(o.id) === orderId);
      if (!item || !orderListItemMayRequestCancel(item)) {
        onNotify(t("community_me_orders_cancel_unavailable"));
        return;
      }
      requestCancelOrder(orderId, trigger);
    },
    [orders, t, onNotify, requestCancelOrder],
  );

  const cancelBusyId =
    cancelApiBusyId ?? (cancelConfirmBusy ? cancelConfirmOrderId : null);

  return {
    cancelConfirmOrderId,
    cancelConfirmBusy: cancelConfirmBusy || cancelApiBusyId != null,
    cancelCancelOrder,
    confirmCancelOrder,
    onRequestCancel,
    cancelBusyId,
  };
}
