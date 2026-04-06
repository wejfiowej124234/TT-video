import type { OrderListItem } from "@/lib/apiClient";

/** B-047：取消成功后列表就地与服务端一致（仍保留该行，`state`/`status` 为 cancelled），不整页 `refreshOrders` */
export function patchOrderListAfterCancelSuccess(
  prev: OrderListItem[],
  orderId: string,
  apiOrder?: { status?: string; state?: string } | null,
): OrderListItem[] {
  const idNorm = String(orderId);
  const terminal = (apiOrder?.status ?? apiOrder?.state ?? "cancelled").toLowerCase();
  return prev.map((o) => (String(o.id) === idNorm ? { ...o, status: terminal, state: terminal } : o));
}

/** 行程预览抽屉与列表同源字段同步（若正打开该单） */
export function patchPreviewOrderAfterCancelSuccess<T extends { id: string; status?: string; state?: string }>(
  current: T | null,
  orderId: string,
  apiOrder?: { status?: string; state?: string } | null,
): T | null {
  if (!current || String(current.id) !== String(orderId)) return current;
  const terminal = (apiOrder?.status ?? apiOrder?.state ?? "cancelled").toLowerCase();
  return { ...current, status: terminal, state: terminal };
}
