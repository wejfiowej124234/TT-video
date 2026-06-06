import { useEffect, useState } from "react";
import type { OrderListItem } from "@/lib/apiClient";

/** `/orders` 客户端搜索 query 参数；有值时 `GET /orders?q=` 服务端过滤，本地再对齐高亮。 */
export const ORDERS_LIST_SEARCH_QUERY = "q" as const;

export type OrdersListSearchTextPart = { text: string; match: boolean };

export function escapeOrdersListSearchRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 按搜索词切分文案，供暖金 `<mark>` 高亮（大小写不敏感 · 多次命中）。 */
export function splitTextByOrdersListSearchQuery(text: string, rawQuery: string): OrdersListSearchTextPart[] {
  const q = rawQuery.trim();
  if (!q) return [{ text, match: false }];

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: OrdersListSearchTextPart[] = [];
  let start = 0;

  while (start < text.length) {
    const idx = lower.indexOf(needle, start);
    if (idx === -1) {
      parts.push({ text: text.slice(start), match: false });
      break;
    }
    if (idx > start) parts.push({ text: text.slice(start, idx), match: false });
    parts.push({ text: text.slice(idx, idx + needle.length), match: true });
    start = idx + needle.length;
  }

  return parts.length > 0 ? parts : [{ text, match: false }];
}

/** 客户端搜索：在已加载列表内按目的地 / 国家 / 城市 / 订单号模糊匹配（① · 不触发 API）。 */
export function filterOrdersListByClientSearch(list: OrderListItem[], rawQuery: string): OrderListItem[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return list;
  return list.filter((item) => {
    const haystack = [
      item?.destination,
      item?.city,
      item?.country,
      item?.id,
      item?.state,
      item?.status,
    ]
      .filter((v) => v != null && String(v).trim() !== "")
      .map((v) => String(v).toLowerCase());
    return haystack.some((part) => part.includes(q));
  });
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
