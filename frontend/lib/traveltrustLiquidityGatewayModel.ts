/**
 * 网络页「兑换网关」预览币对 SSOT（① 本地示意，非链上真兑换）。
 *
 * - **行程 Escrow**：白名单稳定币 **USDC / USDT** 均可（94）；API 默认结算符号常为 **USDC**（`SETTLEMENT_TOKEN`）。
 * - **本段 UI**：示意 **稳定币 → TTG（治理代币）**；**不是** USDC↔USDT 互换。
 * - 真链路径见 96-18、governance-token/02、治理中心路由 /governance。
 */

export const TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS = ["USDC", "USDT"] as const;

export type TraveltrustEscrowSettlementStablecoin =
  (typeof TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS)[number];

/** 后端 / 环境默认结算符号（Escrow）；用户仍可在订单侧选 USDT。 */
export const TRAVELTRUST_DEFAULT_SETTLEMENT_STABLECOIN: TraveltrustEscrowSettlementStablecoin =
  "USDC";

export const TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL = "TTG" as const;

export function traveltrustTtgAcquirePreviewPair(
  payStable: TraveltrustEscrowSettlementStablecoin,
): { from: TraveltrustEscrowSettlementStablecoin; to: typeof TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL } {
  return { from: payStable, to: TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL };
}

export function traveltrustCyclePayStablecoin(
  current: TraveltrustEscrowSettlementStablecoin,
): TraveltrustEscrowSettlementStablecoin {
  const idx = TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS.indexOf(current);
  const next = (idx + 1) % TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS.length;
  return TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS[next]!;
}
