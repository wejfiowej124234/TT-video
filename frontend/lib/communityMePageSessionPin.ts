"use client";

import { useCallback, useMemo, useState } from "react";

import { applyPinOrder } from "@/lib/communityMeNotesPinOrder";

/** 独立页 / Hub drawer 会话内置顶：与 `applyPinOrder` 同源，刷新后恢复 API 顺序。 */
export function useCommunityMePageSessionPin<T>(
  items: readonly T[],
  getId: (item: T) => string,
) {
  const [pinOrder, setPinOrder] = useState<string[]>([]);
  const itemsForGrid = useMemo(
    () => applyPinOrder(items, getId, pinOrder),
    [items, getId, pinOrder],
  );
  const pinToTop = useCallback((id: string) => {
    setPinOrder((prev) => [id, ...prev.filter((x) => x !== id)]);
  }, []);
  const removeFromPin = useCallback((id: string) => {
    setPinOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev));
  }, []);
  const resetPin = useCallback(() => {
    setPinOrder([]);
  }, []);
  return { itemsForGrid, pinToTop, removeFromPin, resetPin };
}
