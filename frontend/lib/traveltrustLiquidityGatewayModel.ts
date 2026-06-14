/**
 * 网络页「兑换网关」与行程 Escrow 结算稳定币 SSOT（① 本地示意，非链上真兑换）。
 *
 * - **行程 Escrow / 池子收款 / 治理兑换支付币**：**USDC**（与 **01**「结算代币定稿」、**`SETTLEMENT_TOKEN`** 一致）。
 * - **本段 UI**：示意 **USDC → TTG（治理代币）**；**不是** 稳定币互换。
 * - 真链路径见 96-18、governance-token/02、治理中心路由 /governance。
 */

export const TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS = ["USDC"] as const;

export type TraveltrustEscrowSettlementStablecoin =
  (typeof TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS)[number];

/** 后端 / 环境 / 订单 Escrow 默认结算符号（**01 P0：仅 USDC**）。 */
export const TRAVELTRUST_DEFAULT_SETTLEMENT_STABLECOIN: TraveltrustEscrowSettlementStablecoin =
  "USDC";

export const TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL = "TTG" as const;

export function traveltrustTtgAcquirePreviewPair(
  payStable: TraveltrustEscrowSettlementStablecoin,
): { from: TraveltrustEscrowSettlementStablecoin; to: typeof TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL } {
  return { from: payStable, to: TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL };
}

/** 单币 SSOT 下恒等；保留 API 形状供网关组件复用。 */
export function traveltrustCyclePayStablecoin(
  current: TraveltrustEscrowSettlementStablecoin,
): TraveltrustEscrowSettlementStablecoin {
  return current;
}
