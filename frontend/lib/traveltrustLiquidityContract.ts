import type { TravelTrustPageBrief } from "@/lib/traveltrustPageBrief";
import {
  TRAVELTRUST_DEFAULT_SETTLEMENT_STABLECOIN,
  TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS,
  TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL,
  type TraveltrustEscrowSettlementStablecoin,
} from "@/lib/traveltrustLiquidityGatewayModel";

export type TraveltrustLiquidityContract = {
  schema_version: number;
  pair_type: "stablecoin_to_governance_token";
  pay_stablecoins: TraveltrustEscrowSettlementStablecoin[];
  default_pay_stable: TraveltrustEscrowSettlementStablecoin;
  receive_symbol: typeof TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL;
  receive_token_role: "governance";
  not_pair_types: string[];
  quote_path: string;
  onboarding_fee_quote_path: string;
  escrow_pay_path: string;
  governance_hub_path: string;
  implementation_status: string;
  spec_doc_ref: string;
};

export const TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK: TraveltrustLiquidityContract = {
  schema_version: 1,
  pair_type: "stablecoin_to_governance_token",
  pay_stablecoins: [...TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS],
  default_pay_stable: TRAVELTRUST_DEFAULT_SETTLEMENT_STABLECOIN,
  receive_symbol: TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL,
  receive_token_role: "governance",
  not_pair_types: ["stablecoin_to_stablecoin"],
  quote_path: "/api/v1/governance/ttg-exchange/quote",
  onboarding_fee_quote_path: "/api/v1/onboarding/quote",
  escrow_pay_path: "/pay",
  governance_hub_path: "/governance",
  implementation_status: "contract_only",
  spec_doc_ref: "docs/spec/96-18-商家与主理人准入费用与治理币兑换设计.md",
};

export function traveltrustLiquidityContractFromBrief(
  brief: TravelTrustPageBrief | null | undefined,
): TraveltrustLiquidityContract {
  const raw = brief?.liquidity_contract;
  if (!raw || raw.pair_type !== "stablecoin_to_governance_token") {
    return TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK;
  }
  const pay = raw.pay_stablecoins?.filter((s): s is TraveltrustEscrowSettlementStablecoin => s === "USDC");
  return {
    ...TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK,
    ...raw,
    pay_stablecoins: pay?.length ? pay : TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK.pay_stablecoins,
    default_pay_stable:
      raw.default_pay_stable === "USDC" ? raw.default_pay_stable : TRAVELTRUST_DEFAULT_SETTLEMENT_STABLECOIN,
    receive_symbol: TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL,
  };
}
