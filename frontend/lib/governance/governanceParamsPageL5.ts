/**
 * `/governance/params` · L5 暖金 cinematic（① · 同源 `/` + `/orders` + `/governance/proposals`）。
 */
export { GOV_PROPOSALS_L5 as GOV_PARAMS_L5 } from "@/lib/governance/governanceProposalsListL5";
export { GovernanceProposalsL5Panel as GovernanceParamsL5Panel } from "@/lib/governance/governanceProposalsL5Ui";

import { traveltrustProductL5ShellDataAttrs } from "@/lib/traveltrustHomepageFunnelL5";

export const GOV_PARAMS_L5_VISUAL_DATA_ATTR = "l5" as const;
export const GOV_PARAMS_L5_SSOT_ID = "TT-GOV-PARAMS-L5-2026-06" as const;

export function governanceParamsPageL5MainDataAttrs(): Record<string, string> {
  return {
    ...traveltrustProductL5ShellDataAttrs("governance-params"),
    "data-tt-marketing-product-shell": "1",
    "data-tt-governance-params-page": "1",
    "data-tt-governance-params-l5": GOV_PARAMS_L5_VISUAL_DATA_ATTR,
    "data-tt-governance-params-l5-ssot": GOV_PARAMS_L5_SSOT_ID,
  };
}

/** 深色 cinematic 表格（params 只读表） */
export const GOV_PARAMS_TABLE = {
  headRow: "border-b border-white/12 text-slate-400",
  bodyRow: "border-b border-white/8 text-slate-200",
  bumpCell: "bg-ref-sun/10 dark:bg-ref-sun/15",
  mono: "font-mono tabular-nums text-slate-100",
} as const;
