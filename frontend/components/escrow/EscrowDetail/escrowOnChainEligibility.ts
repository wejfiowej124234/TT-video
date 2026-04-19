/**
 * 53-S10：链上 Escrow 按钮与 API 订单态对齐（04 §3.4、14「评分→release」）
 * 合约 release 在链上仅要求 Funded；产品顺序由链下字段约束。
 */
import type { OrderRow } from "./types";
import { orderAmountToBigInt } from "./utils";

/** 列表 / 市场卡 / 抽屉：与详情页 canDeposit 同源判定（07 付款路径、35） */
export function orderLikeMayOnchainDeposit(order: {
  state?: string;
  status?: string;
  amount?: string;
  escrow_address?: string | null;
} | null | undefined): boolean {
  if (!order) return false;
  const hasEscrow = Boolean(order.escrow_address);
  const depositAmount = orderAmountToBigInt(order.amount);
  return canDepositToEscrow(order as OrderRow, hasEscrow, depositAmount);
}

function normState(order: OrderRow | null): string {
  if (!order) return "";
  return String(order.state ?? order.status ?? "").toLowerCase();
}

function normSub(order: OrderRow | null): string {
  return String(order?.sub_status ?? "")
    .toLowerCase()
    .replace(/-/g, "_");
}

function ratingBothConfirmed(order: OrderRow | null): boolean {
  if (!order) return false;
  const o = order as OrderRow & {
    rating_tourist_confirmed?: boolean;
    rating_guide_confirmed?: boolean;
  };
  if (o.rating_tourist_confirmed === true && o.rating_guide_confirmed === true) return true;
  return normSub(order) === "rating_confirmed";
}

/** 链上 deposit：Accepted / Escrowed（mock 已付但未上链）等可尝试；Completed 后不再展示为可付 */
export function canDepositToEscrow(
  order: OrderRow | null,
  hasEscrow: boolean,
  depositAmount: bigint | undefined
): boolean {
  if (!hasEscrow || depositAmount === undefined) return false;
  const st = normState(order);
  if (
    !st ||
    st === "draft" ||
    st === "created" ||
    st === "completed" ||
    st === "released" ||
    st === "cancelled" ||
    st === "canceled" ||
    st === "disputed" ||
    st === "refunded" ||
    st === "closed"
  ) {
    return false;
  }
  return st === "accepted" || st === "escrowed" || st === "funded" || st === "confirmed";
}

/**
 * 链上 release：仅 Completed 且双方已 confirm-rating（与 chain_off order_confirm_rating_impl 一致）
 */
export function canReleaseAfterRating(order: OrderRow | null, hasEscrow: boolean): boolean {
  if (!hasEscrow || !order) return false;
  const st = normState(order);
  if (st !== "completed") return false;
  return ratingBothConfirmed(order);
}

/**
 * 链上 refund（仅旅行者，合约校验）：已双方评分确认后应走 release，不再引导 refund
 */
export function canRefundEscrow(order: OrderRow | null, hasEscrow: boolean): boolean {
  if (!hasEscrow || !order) return false;
  if (ratingBothConfirmed(order)) return false;
  const st = normState(order);
  return st === "escrowed" || st === "funded" || st === "completed";
}

/**
 * 链上 `openDispute`：与 `OrderActionsBlock` 链下争议同一组态（accepted | escrowed | funded），B-037。
 */
export function canOpenDisputeOnChain(order: OrderRow | null, hasEscrow: boolean): boolean {
  if (!hasEscrow || !order) return false;
  const st = normState(order);
  return st === "accepted" || st === "escrowed" || st === "funded";
}

/**
 * 当 `!canOpenDisputeOnChain(order, true)` 时，`EscrowOnChainActions` 展示用的 i18n 键；可争议态返回 null。
 */
export function escrowDisputeOnChainUnavailableReasonKey(order: OrderRow | null): string | null {
  if (!order) return "escrow_disputeBlocked_wrongState";
  const st = normState(order);
  if (st === "accepted" || st === "escrowed" || st === "funded") return null;
  if (st === "disputed") return "escrow_disputeBlocked_alreadyOpen";
  if (st === "completed" || st === "released") return "escrow_disputeBlocked_orderCompleted";
  if (st === "created" || st === "draft") return "escrow_disputeBlocked_tooEarly";
  if (st === "cancelled" || st === "canceled" || st === "refunded" || st === "closed") {
    return "escrow_disputeBlocked_terminal";
  }
  return "escrow_disputeBlocked_wrongState";
}
