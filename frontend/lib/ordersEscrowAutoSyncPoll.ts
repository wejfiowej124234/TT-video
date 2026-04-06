/**
 * B-069：`/orders` 与 `OrderDetailDrawer` 在订单接近/处于可入金链时，静默对齐 `GET /api/v1/orders`（及抽屉内 `getOrder`）。
 * 轮询间隔钉死为 **5s**，验收「入金/mock-pay 后 T 秒内」指该间隔量级下的自动对齐（非手刷）。
 */
import type { OrderListItem } from "@/lib/apiClient/orders";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";

export const ORDERS_ESCROW_AUTO_SYNC_POLL_MS = 5_000;

/** 列表项：需后台可能从 Accepted→Escrowed 或入金后状态推进时，参与静默轮询 */
export function orderListItemWatchesForBackendEscrowSync(item: OrderListItem): boolean {
  const st = String(item.state ?? item.status ?? "").toLowerCase();
  if (st === "accepted") return true;
  return orderLikeMayOnchainDeposit(item);
}

/** 抽屉内 `OrderDetailItem` 同源判定（与列表一致） */
export function orderDetailItemWatchesForBackendEscrowSync(order: {
  state?: string;
  status?: string;
  amount?: string;
  escrow_address?: string | null;
} | null | undefined): boolean {
  if (!order) return false;
  const st = String(order.state ?? order.status ?? "").toLowerCase();
  if (st === "accepted") return true;
  return orderLikeMayOnchainDeposit(order);
}
