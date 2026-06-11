import { isAssignedGuideId } from "@/lib/isAssignedGuideId";

/** 与 `order_accept_impl` 同源：当前会话是否可在 UI 展示「接单」。 */
export function canViewerAcceptOrder(input: {
  meUserId?: string | null;
  meGuideRowId?: string | null;
  orderTouristId?: string | null;
  orderGuideId?: string | null;
}): boolean {
  const meGuideRowId = String(input.meGuideRowId ?? "").trim();
  if (!meGuideRowId) return false;

  const meUserId = String(input.meUserId ?? "").trim();
  const orderTouristId = String(input.orderTouristId ?? "").trim();
  if (meUserId && orderTouristId && meUserId === orderTouristId) return false;

  if (isAssignedGuideId(input.orderGuideId)) {
    return String(input.orderGuideId).trim() === meGuideRowId;
  }

  return true;
}

/** 双边确认区：当前会话相对本单是否为向导侧（与 `order_is_participant` / 接单门闸同源）。 */
export function viewerIsGuideForBilateralOrder(input: {
  meUserId?: string | null;
  meGuideRowId?: string | null;
  orderTouristId?: string | null;
  orderGuideId?: string | null;
}): boolean {
  const meUserId = String(input.meUserId ?? "").trim();
  const orderTouristId = String(input.orderTouristId ?? "").trim();
  if (meUserId && orderTouristId && meUserId === orderTouristId) return false;

  const meGuideRowId = String(input.meGuideRowId ?? "").trim();
  const orderGuideId = String(input.orderGuideId ?? "").trim();
  if (meGuideRowId && isAssignedGuideId(orderGuideId)) {
    return meGuideRowId === orderGuideId;
  }
  if (isAssignedGuideId(orderGuideId) && meUserId && orderTouristId && meUserId !== orderTouristId) {
    return true;
  }
  return Boolean(meGuideRowId);
}
