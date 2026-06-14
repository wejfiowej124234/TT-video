import type { OrderListItem } from "@/lib/apiClient";

/**
 * 与后端 **`business_line`** 枚举一致（`crates/api/src/chain_off/orders.rs` · `order_business_line_for_chain_off`）。
 * 前端不做目的地/关键词启发式分类。
 */
export type CommunityMeOrderDrawerKind = "trip" | "merchant_service" | "acquisition";

export function communityMeOrderDrawerKindI18nKey(kind: CommunityMeOrderDrawerKind): string {
  switch (kind) {
    case "trip":
      return "community_me_order_kind_trip";
    case "acquisition":
      return "community_me_order_kind_acquisition";
    default:
      return "community_me_order_kind_merchant_service";
  }
}

const VALID: ReadonlySet<string> = new Set(["trip", "merchant_service", "acquisition"]);

/**
 * 读取列表项 **`business_line`**；缺省或非法值时 **fail-closed** 为 `trip`（与后端 `order_business_line_for_chain_off` 默认一致）。
 */
export function orderBusinessLineFromApi(item: OrderListItem): CommunityMeOrderDrawerKind {
  const raw = (item.business_line ?? "").trim().toLowerCase();
  if (VALID.has(raw)) return raw as CommunityMeOrderDrawerKind;
  return "trip";
}

export function formatOrderListTitle(item: OrderListItem): string {
  const d = (item.destination ?? "").trim() || (item.city ?? "").trim() || (item.country ?? "").trim();
  return d;
}

export function formatOrderIdShort(id: string): string {
  const s = String(id ?? "").trim();
  if (!s) return "";
  if (s.length <= 12) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

type TFunc = (k: string) => string;

export function formatOrderAmountLine(item: OrderListItem, t: TFunc): string {
  const raw = item.amount;
  if (raw == null || String(raw).trim() === "") return t("ui_em_dash");
  const cur = (item.currency ?? "").trim() || t("order_defaultSettlementToken");
  return `${String(raw).trim()} ${cur}`;
}
