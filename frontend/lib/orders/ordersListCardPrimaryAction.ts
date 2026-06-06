import type { OrderListItem } from "@/lib/apiClient";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import { isDraftOrderListState } from "@/lib/isDraftOrderListState";

export type OrdersListCardPrimaryAction =
  | { kind: "pay"; orderId: string }
  | { kind: "escrow"; orderId: string; draft: boolean }
  | { kind: "preview"; orderId: string }
  | { kind: "none" };

/** 与卡片右侧主按钮优先级一致：支付 → 托管/继续编辑 → 行程预览 */
export function resolveOrdersListCardPrimaryAction(item: OrderListItem): OrdersListCardPrimaryAction {
  const orderId = item?.id != null ? String(item.id).trim() : "";
  if (!orderId) return { kind: "none" };

  if (orderLikeMayOnchainDeposit(item)) {
    return { kind: "pay", orderId };
  }

  const state = (item?.state ?? item?.status ?? "").toLowerCase();
  const draft = isDraftOrderListState(state);
  return { kind: "escrow", orderId, draft };
}
