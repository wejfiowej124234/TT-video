"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  ORDERS_LIST_CARD_SWIPE_REVEAL_PX,
  clampOrdersListCardSwipeOffset,
  resolveOrdersListCardSwipeOffsetAfterRelease,
} from "@/lib/orders/ordersListCardSwipe";

const HORIZONTAL_DRAG_START_PX = 8;

export function useOrdersListCardSwipe({
  cardId,
  openSwipeCardId,
  setOpenSwipeCardId,
}: {
  cardId: string;
  openSwipeCardId: string | null;
  setOpenSwipeCardId: (id: string | null) => void;
}) {
  const [offsetPx, setOffsetPx] = useState(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const draggingRef = useRef(false);

  const isOpen = openSwipeCardId === cardId && offsetPx <= -ORDERS_LIST_CARD_SWIPE_REVEAL_PX / 2;

  useEffect(() => {
    if (openSwipeCardId !== cardId && offsetPx !== 0) {
      setOffsetPx(0);
    }
  }, [openSwipeCardId, cardId, offsetPx]);

  const closeSwipe = useCallback(() => {
    setOffsetPx(0);
    if (openSwipeCardId === cardId) setOpenSwipeCardId(null);
  }, [cardId, openSwipeCardId, setOpenSwipeCardId]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (openSwipeCardId && openSwipeCardId !== cardId) {
        setOpenSwipeCardId(null);
      }
      startXRef.current = e.touches[0]?.clientX ?? 0;
      startYRef.current = e.touches[0]?.clientY ?? 0;
      startOffsetRef.current = offsetPx;
      draggingRef.current = false;
      setOpenSwipeCardId(cardId);
    },
    [cardId, offsetPx, openSwipeCardId, setOpenSwipeCardId],
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;
    if (!draggingRef.current) {
      if (Math.abs(dx) < HORIZONTAL_DRAG_START_PX) return;
      if (Math.abs(dx) < Math.abs(dy)) return;
      draggingRef.current = true;
    }
    if (!draggingRef.current) return;
    setOffsetPx(clampOrdersListCardSwipeOffset(startOffsetRef.current + dx));
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const settled = resolveOrdersListCardSwipeOffsetAfterRelease(offsetPx);
    setOffsetPx(settled);
    setOpenSwipeCardId(settled === 0 ? null : cardId);
  }, [cardId, offsetPx, setOpenSwipeCardId]);

  return {
    offsetPx,
    isOpen,
    closeSwipe,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeSurfaceStyle:
      offsetPx !== 0 ? ({ transform: `translateX(${offsetPx}px)` } as const) : undefined,
  };
}
