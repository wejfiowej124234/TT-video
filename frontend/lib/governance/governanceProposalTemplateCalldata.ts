import { encodeFunctionData, type Hex } from "viem";
import type { GovernanceProposalTemplateId } from "./governanceProposalCreateModel";
import type { ChainContractsSnapshot } from "@/lib/governanceChainMeta";

/** Governor · Timelock 路径可执行的参数更新（与 TravelTrustGovernor.sol 对拍） */
const governorSetReviewWindowAbi = [
  {
    type: "function",
    name: "setOrderRatingReviewWindowDays",
    stateMutability: "nonpayable",
    inputs: [{ name: "days_", type: "uint256" }],
    outputs: [],
  },
] as const;

/** ① 模板默认 · 90 天评价窗口（与 protocol-ssot 常见默认一致；治理仍须 Timelock 执行） */
export const GOVERNANCE_TEMPLATE_DEFAULT_REVIEW_WINDOW_DAYS = 90n;

export type GovernanceTemplateActionPreset = {
  targetAddress: string;
  calldataHex: Hex;
  ethValue: string;
  humanSummaryKey: string;
  humanSummaryVars?: Record<string, string | number>;
};

/** 行业 L5：模板选择时自动生成 target + calldata（非手填 hex） */
export function buildGovernanceTemplateActionPreset(
  templateId: GovernanceProposalTemplateId,
  contracts: ChainContractsSnapshot | null,
): GovernanceTemplateActionPreset | null {
  const governor = contracts?.governor_address?.trim() ?? "";
  const treasury = contracts?.treasury_address?.trim() ?? "";
  const timelock = contracts?.timelock_address?.trim() ?? "";
  const feeRouter = contracts?.fee_router_address?.trim() ?? "";

  switch (templateId) {
    case "platform_params": {
      if (!governor.startsWith("0x")) return null;
      return {
        targetAddress: governor,
        calldataHex: encodeFunctionData({
          abi: governorSetReviewWindowAbi,
          functionName: "setOrderRatingReviewWindowDays",
          args: [GOVERNANCE_TEMPLATE_DEFAULT_REVIEW_WINDOW_DAYS],
        }),
        ethValue: "0",
        humanSummaryKey: "governance_create_template_calldata_platform_params",
        humanSummaryVars: { days: Number(GOVERNANCE_TEMPLATE_DEFAULT_REVIEW_WINDOW_DAYS) },
      };
    }
    case "treasury": {
      if (!treasury.startsWith("0x")) return null;
      return {
        targetAddress: treasury,
        calldataHex: "0x",
        ethValue: "0",
        humanSummaryKey: "governance_create_template_calldata_treasury_stub",
      };
    }
    case "region": {
      if (!timelock.startsWith("0x")) return null;
      return {
        targetAddress: timelock,
        calldataHex: "0x",
        ethValue: "0",
        humanSummaryKey: "governance_create_template_calldata_region_stub",
      };
    }
    case "did": {
      const target = governor.startsWith("0x") ? governor : feeRouter;
      if (!target.startsWith("0x")) return null;
      return {
        targetAddress: target,
        calldataHex: "0x",
        ethValue: "0",
        humanSummaryKey: "governance_create_template_calldata_did_stub",
      };
    }
    case "emergency": {
      if (!timelock.startsWith("0x")) return null;
      return {
        targetAddress: timelock,
        calldataHex: "0x",
        ethValue: "0",
        humanSummaryKey: "governance_create_template_calldata_emergency_stub",
      };
    }
    case "custom":
    default:
      return null;
  }
}
