"use client";

import { useRef, useEffect, useCallback, useMemo, type MutableRefObject } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { orderAccept, getIdempotencyKey } from "@/lib/apiClient";
import type { MarketView } from "@/components/market/ViewSwitcher";
import type { OrderCardItem } from "@/components/market/OrderCard";
import type { GuideCardItem } from "@/components/market/GuideCard";
import {
  MARKET_GUIDE_DETAIL_QUERY,
  MARKET_ITINERARY_DRAFT_QUERY,
  MARKET_ORDER_DETAIL_QUERY,
} from "@/lib/marketDeepLink";
import { isUuidString } from "@/lib/isUuidString";
import { stashEscrowOrderPrefetchFromMarketCard } from "@/lib/orderEscrowPrefetch";

type RouterReplace = { replace: (href: string, options?: { scroll?: boolean }) => void };

export function useMarketPageAcceptAndItineraryDeepLinks(opts: {
  searchParams: ReadonlyURLSearchParams;
  router: RouterReplace;
  pathname: string | null;
  detailOrder: OrderCardItem | null;
  setDetailOrder: (o: OrderCardItem | null) => void;
  setDetailGuide: (g: GuideCardItem | null) => void;
  loadOrders: () => void | Promise<void>;
  setCustomItineraryOpen: (open: boolean) => void;
  setCustomCreatedOrderId: (id: string | null) => void;
  setCustomCreatedToast: (v: boolean) => void;
  setView: (v: MarketView) => void;
  setAcceptSuccessToast: (v: boolean) => void;
  setAcceptSuccessOrderId: (id: string | null) => void;
  suppressMarketOrderDeepLinkRef: MutableRefObject<string | null>;
  suppressMarketGuideDeepLinkRef: MutableRefObject<string | null>;
}) {
  const {
    searchParams,
    router,
    pathname,
    detailOrder,
    setDetailOrder,
    setDetailGuide,
    loadOrders,
    setCustomItineraryOpen,
    setCustomCreatedOrderId,
    setCustomCreatedToast,
    setView,
    setAcceptSuccessToast,
    setAcceptSuccessOrderId,
    suppressMarketOrderDeepLinkRef,
    suppressMarketGuideDeepLinkRef,
  } = opts;

  const detailOrderRef = useRef<OrderCardItem | null>(null);
  useEffect(() => {
    detailOrderRef.current = detailOrder;
  }, [detailOrder]);

  const dismissOrderDetailDeepLink = useCallback(() => {
    const r = searchParams.get(MARKET_ORDER_DETAIL_QUERY)?.trim() ?? "";
    suppressMarketOrderDeepLinkRef.current = r || null;
    setDetailOrder(null);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(MARKET_ORDER_DETAIL_QUERY);
    const qs = next.toString();
    const base = pathname ?? "/market";
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
  }, [searchParams, router, pathname, setDetailOrder, suppressMarketOrderDeepLinkRef]);

  const dismissGuideDetailDeepLink = useCallback(() => {
    const r = searchParams.get(MARKET_GUIDE_DETAIL_QUERY)?.trim() ?? "";
    suppressMarketGuideDeepLinkRef.current = r || null;
    setDetailGuide(null);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(MARKET_GUIDE_DETAIL_QUERY);
    const qs = next.toString();
    const base = pathname ?? "/market";
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
  }, [searchParams, router, pathname, setDetailGuide, suppressMarketGuideDeepLinkRef]);

  const customItineraryPreselectedGuideId = useMemo(
    () => searchParams.get("guide_id")?.trim() ?? "",
    [searchParams]
  );

  const customItineraryHydrateDraftId = useMemo(() => {
    const raw = searchParams.get(MARKET_ITINERARY_DRAFT_QUERY)?.trim() ?? "";
    return raw && isUuidString(raw) ? raw : "";
  }, [searchParams]);

  useEffect(() => {
    if (!customItineraryHydrateDraftId) return;
    setCustomItineraryOpen(true);
  }, [customItineraryHydrateDraftId, setCustomItineraryOpen]);

  const clearItineraryDraftDeepLink = useCallback(() => {
    const raw = searchParams.get(MARKET_ITINERARY_DRAFT_QUERY)?.trim() ?? "";
    if (!raw) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(MARKET_ITINERARY_DRAFT_QUERY);
    const qs = next.toString();
    const base = pathname ?? "/market";
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
  }, [searchParams, router, pathname]);

  const handleCustomItinerarySubmit = useCallback(
    (orderId: string) => {
      clearItineraryDraftDeepLink();
      setCustomItineraryOpen(false);
      setCustomCreatedOrderId(orderId);
      setCustomCreatedToast(true);
      setView("orders");
      void loadOrders();
      setTimeout(() => {
        setCustomCreatedToast(false);
        setCustomCreatedOrderId(null);
      }, 4000);
    },
    [loadOrders, clearItineraryDraftDeepLink, setCustomItineraryOpen, setCustomCreatedOrderId, setCustomCreatedToast, setView]
  );

  const acceptIdempotencyKeyRef = useRef<Record<string, string>>({});
  const handleConfirmAccept = useCallback(
    async (orderId: string) => {
      const key = acceptIdempotencyKeyRef.current[orderId] ?? (acceptIdempotencyKeyRef.current[orderId] = getIdempotencyKey());
      const snap = detailOrderRef.current;
      await orderAccept(orderId, key);
      if (snap && String(snap.id) === String(orderId)) {
        stashEscrowOrderPrefetchFromMarketCard(snap);
      }
      setDetailOrder(null);
      setAcceptSuccessOrderId(orderId);
      setAcceptSuccessToast(true);
      void loadOrders();
      setTimeout(() => {
        setAcceptSuccessToast(false);
        setAcceptSuccessOrderId(null);
      }, 4000);
    },
    [loadOrders, setDetailOrder, setAcceptSuccessOrderId, setAcceptSuccessToast]
  );

  return {
    dismissOrderDetailDeepLink,
    dismissGuideDetailDeepLink,
    customItineraryPreselectedGuideId,
    customItineraryHydrateDraftId,
    clearItineraryDraftDeepLink,
    handleCustomItinerarySubmit,
    handleConfirmAccept,
  };
}
