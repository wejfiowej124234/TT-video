"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { OrderListItem } from "@/lib/apiClient";
import type { OrderDetailItem } from "@/components/market/OrderDetailDrawer";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { OrdersListCardItem } from "./OrdersListCardItem";
import { OrdersListInteractionHint } from "./OrdersListInteractionHint";
import { OrdersListCardsWindowVirtual } from "./OrdersListCardsWindowVirtual";
import { useOrdersListCardKeyboardNav } from "./useOrdersListCardKeyboardNav";
import { stashEscrowOrderPrefetchFromListItem } from "@/lib/orderEscrowPrefetch";
import { resolveOrdersListCardPrimaryAction } from "@/lib/orders/ordersListCardPrimaryAction";
import { ORDERS_LIST_VIRTUAL_MIN } from "@/lib/orders/ordersListVirtualConstants";
import { orderListItemToDetailDrawer } from "./ordersListPageModel";

export function OrdersListCards({
  t,
  list,
  totalCount,
  searchActive = false,
  searchHighlightQuery = "",
  searchInput = "",
  deletingId,
  openSwipeCardId,
  setOpenSwipeCardId,
  setPreviewOrder,
  handleDeleteOrder,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  list: OrderListItem[];
  totalCount?: number;
  searchActive?: boolean;
  searchHighlightQuery?: string;
  searchInput?: string;
  deletingId: string | null;
  openSwipeCardId: string | null;
  setOpenSwipeCardId: (id: string | null) => void;
  setPreviewOrder: (o: OrderDetailItem | null) => void;
  handleDeleteOrder: (orderId: string, stateOrStatus: string, tConfirm: (k: string) => string) => Promise<void>;
}) {
  const loadedTotal = totalCount ?? list.length;
  const highlightQuery = searchActive ? searchHighlightQuery : "";
  const router = useRouter();

  const listIds = useMemo(
    () => list.map((item, i) => String(item?.id ?? i)),
    [list],
  );
  const { focusedCardId, listFocusRef, onListFocus, onListKeyDown: onListKeyDownBase } =
    useOrdersListCardKeyboardNav(listIds);

  const openFocusedCardPrimary = useCallback(() => {
    if (!focusedCardId) return;
    const item = list.find((row, i) => String(row?.id ?? i) === focusedCardId);
    if (!item) return;
    const action = resolveOrdersListCardPrimaryAction(item);
    if (action.kind === "none") return;
    if (action.kind === "preview") {
      setPreviewOrder(orderListItemToDetailDrawer(item));
      return;
    }
    stashEscrowOrderPrefetchFromListItem(item);
    if (action.kind === "pay") {
      router.push(`/pay?orderId=${encodeURIComponent(action.orderId)}`);
      return;
    }
    router.push(`/escrow/${encodeURIComponent(action.orderId)}`);
  }, [focusedCardId, list, router, setPreviewOrder]);

  const onListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement | HTMLDivElement>) => {
      onListKeyDownBase(e);
      if (e.defaultPrevented) return;
      if (e.key === "Enter" && focusedCardId) {
        e.preventDefault();
        openFocusedCardPrimary();
      }
    },
    [focusedCardId, onListKeyDownBase, openFocusedCardPrimary],
  );

  useEffect(() => {
    if (!openSwipeCardId) return;
    const close = () => setOpenSwipeCardId(null);
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-tt-orders-card-swipe="1"]')) return;
      close();
    };
    const onScroll = () => close();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (searchInput.trim()) return;
      e.preventDefault();
      close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openSwipeCardId, searchInput, setOpenSwipeCardId]);

  const useVirtualList = list.length >= ORDERS_LIST_VIRTUAL_MIN;

  const renderCard = (item: OrderListItem, i: number) => (
    <OrdersListCardItem
      key={item?.id ?? String(i)}
      t={t}
      item={item}
      index={i}
      highlightQuery={highlightQuery}
      keyboardFocused={focusedCardId === String(item?.id ?? i)}
      staggerEnter={!useVirtualList}
      as={useVirtualList ? "div" : "li"}
      deletingId={deletingId}
      openSwipeCardId={openSwipeCardId}
      setOpenSwipeCardId={setOpenSwipeCardId}
      setPreviewOrder={setPreviewOrder}
      handleDeleteOrder={handleDeleteOrder}
      onKeyboardActivate={
        focusedCardId === String(item?.id ?? i) ? openFocusedCardPrimary : undefined
      }
    />
  );

  return (
    <>
      {searchActive ? (
        <p className={`mb-2 ${TT_ORDERS_LIST_L5.metaText}`} role="status">
          {t("orders_list_count_filtered", { shown: list.length, total: loadedTotal })}
        </p>
      ) : null}
      <OrdersListInteractionHint t={t} />
      {useVirtualList ? (
        <OrdersListCardsWindowVirtual
          list={list}
          listFocusRef={listFocusRef}
          onListFocus={onListFocus}
          onListKeyDown={onListKeyDown}
          ariaLabel={t("orders_myOrders")}
          renderItem={renderCard}
        />
      ) : (
        <ul
          ref={listFocusRef}
          className="space-y-4 outline-none"
          role="list"
          tabIndex={list.length > 0 ? 0 : undefined}
          data-tt-orders-card-list="1"
          aria-label={t("orders_myOrders")}
          onFocus={onListFocus}
          onKeyDown={onListKeyDown}
        >
          {list.map((item, i) => renderCard(item, i))}
        </ul>
      )}
    </>
  );
}
