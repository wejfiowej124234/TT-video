import type { OrderCardItem } from "./marketTypes";

/**
 * 自由市场 / Discover 列表去重键（54-S9）。
 * 后端若对同一订单返回多行（不同列表 id、相同 order_id），按 order_id 折叠为一卡。
 */
export function discoverOrderDedupeKey(o: OrderCardItem): string {
  const raw = o.order_id != null ? String(o.order_id).trim() : "";
  if (raw) return raw;
  return String(o.id ?? "").trim();
}
