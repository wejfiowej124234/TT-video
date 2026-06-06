/** `/orders` 卡片左滑快捷操作 · 机读常量（①） */
export const ORDERS_LIST_CARD_SWIPE_REVEAL_PX = 132;
export const ORDERS_LIST_CARD_SWIPE_OPEN_THRESHOLD_PX = 56;

export function clampOrdersListCardSwipeOffset(
  offsetPx: number,
  maxRevealPx = ORDERS_LIST_CARD_SWIPE_REVEAL_PX,
): number {
  return Math.max(-maxRevealPx, Math.min(0, offsetPx));
}

/** 松手后吸附全开 / 全关 */
export function resolveOrdersListCardSwipeOffsetAfterRelease(
  offsetPx: number,
  maxRevealPx = ORDERS_LIST_CARD_SWIPE_REVEAL_PX,
  openThresholdPx = ORDERS_LIST_CARD_SWIPE_OPEN_THRESHOLD_PX,
): number {
  const clamped = clampOrdersListCardSwipeOffset(offsetPx, maxRevealPx);
  if (clamped <= -openThresholdPx) return -maxRevealPx;
  return 0;
}
