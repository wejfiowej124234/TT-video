"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
  useMemo,
  useCallback,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { getOrder } from "@/lib/apiClient";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  orderDetailItemWatchesForBackendEscrowSync,
  ORDERS_ESCROW_AUTO_SYNC_POLL_MS,
} from "@/lib/ordersEscrowAutoSyncPoll";
import type { OrderDetailItem, UseOrderDetailDrawerOptions } from "./orderDetailDrawerModel";
import {
  buildEnrichedOrderDetailFromGetOrderResponse,
  computeEscrowSyncPatchAfterPoll,
} from "./orderDetailDrawerGetOrderMerge";

export function useOrderDetailDrawer({
  order,
  loginReturnPath,
  onClose,
  onConfirmAccept,
}: UseOrderDetailDrawerOptions) {
  const { t } = useTranslation();
  const router = useRouter();
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [enrichedOrder, setEnrichedOrder] = useState<OrderDetailItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailFetchError, setDetailFetchError] = useState<string | null>(null);
  const [detailFetchErrorForId, setDetailFetchErrorForId] = useState<string | null>(null);
  const [detailFetchRetryTick, setDetailFetchRetryTick] = useState(0);
  const [escrowSyncPatch, setEscrowSyncPatch] = useState<Partial<OrderDetailItem> | null>(null);
  const orderRef = useRef(order);
  orderRef.current = order;
  const tRef = useRef(t);
  tRef.current = t;
  const orderId = order?.id;
  const embeddedItineraryLen = order?.itinerary?.daily_itinerary?.length ?? 0;
  const trapRef = useFocusTrap(!!order, onClose);
  const drawerTitleId = useId();
  const drawerDescId = useId();
  const agreementHeadingId = useId();
  const agreementBodyId = useId();

  useEffect(() => {
    if (order) setAgreementOpen(false);
  }, [order]);

  useEffect(() => {
    setEscrowSyncPatch(null);
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [order]);

  useLayoutEffect(() => {
    if (!order?.id) {
      setLoadingDetail(false);
      return;
    }
    const hasIt =
      order.itinerary?.daily_itinerary && order.itinerary.daily_itinerary.length > 0;
    if (hasIt) {
      setLoadingDetail(false);
      return;
    }
    setLoadingDetail(true);
  }, [order?.id, order?.itinerary?.daily_itinerary, embeddedItineraryLen]);

  useEffect(() => {
    if (!orderId) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      return;
    }
    const o = orderRef.current;
    if (!o || o.id !== orderId) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      return;
    }
    const hasItinerary = o.itinerary?.daily_itinerary && o.itinerary.daily_itinerary.length > 0;
    if (hasItinerary) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      return;
    }
    const requestedId = orderId;
    setLoadingDetail(true);
    setEnrichedOrder(null);
    setDetailFetchError(null);
    setDetailFetchErrorForId(null);
    getOrder(requestedId)
      .then((res) => {
        if (orderRef.current?.id !== requestedId) return;
        const base = orderRef.current;
        if (!base || base.id !== requestedId) return;
        const merged = buildEnrichedOrderDetailFromGetOrderResponse(base, res);
        setDetailFetchError(null);
        setDetailFetchErrorForId(null);
        if (merged == null) {
          setEnrichedOrder(null);
          return;
        }
        setEnrichedOrder(merged);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("OrderDetailDrawer getOrder:", err);
        }
        if (orderRef.current?.id !== requestedId) return;
        if (err instanceof Error && err.message === "login_required") {
          const back = loginReturnPath?.trim();
          if (back) {
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(back)}`);
            return;
          }
        }
        setEnrichedOrder(null);
        setDetailFetchError(mapApiReadError(err, tRef.current, "escrow_loadFailed"));
        setDetailFetchErrorForId(requestedId);
      })
      .finally(() => {
        if (orderRef.current?.id === requestedId) setLoadingDetail(false);
      });
  }, [orderId, embeddedItineraryLen, detailFetchRetryTick, loginReturnPath, router]);

  const watchEscrowSync = useMemo(() => {
    if (!order) return false;
    const merged = { ...order, ...escrowSyncPatch } as OrderDetailItem;
    return orderDetailItemWatchesForBackendEscrowSync(merged);
  }, [order, escrowSyncPatch]);

  useEffect(() => {
    if (!orderId || !order || !watchEscrowSync) return;
    const run = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      getOrder(orderId)
        .then((res) => {
          if (orderRef.current?.id !== orderId) return;
          const data = res as { order?: Record<string, unknown> };
          const apiOrder = data?.order;
          if (!apiOrder) return;
          setEscrowSyncPatch((prev) => computeEscrowSyncPatchAfterPoll(prev, apiOrder));
        })
        .catch(() => {});
    };
    const intervalId = setInterval(run, ORDERS_ESCROW_AUTO_SYNC_POLL_MS);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", run);
    }
    return () => {
      clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", run);
      }
    };
  }, [orderId, order, watchEscrowSync]);

  const baseDisplayOrder: OrderDetailItem | null = order
    ? enrichedOrder != null && enrichedOrder.id === order.id
      ? enrichedOrder
      : order
    : null;
  const displayOrder: OrderDetailItem | null =
    order && baseDisplayOrder
      ? escrowSyncPatch != null
        ? { ...baseDisplayOrder, ...escrowSyncPatch }
        : baseDisplayOrder
      : null;

  const showDetailFetchError =
    order &&
    detailFetchError != null &&
    detailFetchErrorForId === orderId &&
    !loadingDetail &&
    !displayOrder?.itinerary?.daily_itinerary?.length;

  const onAcceptSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!order || !onConfirmAccept) return;
      setAcceptError(null);
      setAcceptLoading(true);
      void (async () => {
        try {
          await onConfirmAccept(order.id);
          onClose();
        } catch (err) {
          if (typeof window !== "undefined") {
            console.error("OrderDetailDrawer accept:", err);
          }
          if (err instanceof Error && err.message === "login_required") {
            const back = loginReturnPath?.trim();
            if (back) {
              router.replace(`/auth/login?returnUrl=${encodeURIComponent(back)}`);
              return;
            }
          }
          setAcceptError(mapApiReadError(err, t, "order_error_accept_failed"));
        } finally {
          setAcceptLoading(false);
        }
      })();
    },
    [order, onConfirmAccept, onClose, loginReturnPath, router, t],
  );

  return {
    agreementOpen,
    setAgreementOpen,
    acceptLoading,
    acceptError,
    loadingDetail,
    showDetailFetchError: Boolean(showDetailFetchError),
    detailFetchError,
    setDetailFetchRetryTick,
    displayOrder,
    trapRef,
    drawerTitleId,
    drawerDescId,
    agreementHeadingId,
    agreementBodyId,
    onAcceptSubmit,
  };
}
