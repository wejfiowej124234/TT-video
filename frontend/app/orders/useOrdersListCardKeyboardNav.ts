"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useOrdersListCardKeyboardNav(listIds: string[]) {
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const listFocusRef = useRef<HTMLElement | null>(null);

  const focusCardById = useCallback((cardId: string) => {
    setFocusedCardId(cardId);
    document.getElementById(`order-card-${cardId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const moveFocus = useCallback(
    (delta: number) => {
      if (listIds.length === 0) return;
      const currentIndex = focusedCardId ? listIds.indexOf(focusedCardId) : -1;
      let nextIndex = currentIndex + delta;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= listIds.length) nextIndex = listIds.length - 1;
      focusCardById(listIds[nextIndex]!);
    },
    [focusCardById, focusedCardId, listIds],
  );

  useEffect(() => {
    if (focusedCardId && !listIds.includes(focusedCardId)) {
      setFocusedCardId(listIds[0] ?? null);
    }
  }, [focusedCardId, listIds]);

  const onListFocus = useCallback(() => {
    if (!focusedCardId && listIds[0]) focusCardById(listIds[0]);
  }, [focusCardById, focusedCardId, listIds]);

  const onListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (listIds.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocus(1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocus(-1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        focusCardById(listIds[0]!);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        focusCardById(listIds[listIds.length - 1]!);
      }
    },
    [focusCardById, listIds, moveFocus],
  );

  return {
    focusedCardId,
    listFocusRef,
    onListFocus,
    onListKeyDown,
  };
}
