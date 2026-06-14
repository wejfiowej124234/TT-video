import { isAddress, isHex, type Hex } from "viem";

export type GovernanceProposalTemplateId =
  | "platform_params"
  | "treasury"
  | "region"
  | "did"
  | "emergency"
  | "custom";

export type GovernanceProposalAction = {
  targetAddress: string;
  calldataHex: string;
  ethValue: string;
};

export const GOVERNANCE_PROPOSE_MAX_ACTIONS = 8 as const;

/** TravelTrustGovernor MVP：`queue` 要求 `targets.length == 1`（GovSingleOpOnly） */
export const GOVERNANCE_TIMELOCK_MAX_ACTIONS = 1 as const;

export function governanceDraftTimelockActionCount(draft: GovernanceProposalCreateDraft): number {
  return governanceDraftActions(draft).length;
}

export function isGovernanceDraftTimelockCompatible(draft: GovernanceProposalCreateDraft): boolean {
  return governanceDraftTimelockActionCount(draft) <= GOVERNANCE_TIMELOCK_MAX_ACTIONS;
}

export type GovernanceProposalCreateDraft = {
  templateId: GovernanceProposalTemplateId;
  title: string;
  summary: string;
  /** 首 action 镜像（与 actions[0] 同步 · 机读/模板兼容） */
  targetAddress: string;
  calldataHex: string;
  ethValue: string;
  advancedMode: boolean;
  /** 多 action propose（Governor 数组 · 行业 OZ 标准） */
  actions: GovernanceProposalAction[];
};

export type GovernanceProposalRiskTag = "treasury" | "fee_router" | "governor" | "timelock" | "multi_region" | "custom_call";

export const GOVERNANCE_CREATE_STEPS = ["template", "details", "action", "risk", "submit"] as const;
export type GovernanceCreateStepId = (typeof GOVERNANCE_CREATE_STEPS)[number];

export function emptyGovernanceProposalCreateDraft(): GovernanceProposalCreateDraft {
  return {
    templateId: "custom",
    title: "",
    summary: "",
    targetAddress: "",
    calldataHex: "0x",
    ethValue: "0",
    advancedMode: false,
    actions: [{ targetAddress: "", calldataHex: "0x", ethValue: "0" }],
  };
}

/** 归一化 draft → Governor propose 数组参数 */
export function governanceDraftActions(draft: GovernanceProposalCreateDraft): GovernanceProposalAction[] {
  const rows = draft.actions?.length ? draft.actions : [];
  if (rows.length > 0) return rows.slice(0, GOVERNANCE_PROPOSE_MAX_ACTIONS);
  return [
    {
      targetAddress: draft.targetAddress,
      calldataHex: draft.calldataHex,
      ethValue: draft.ethValue,
    },
  ];
}

export function validateGovernanceProposalActions(actions: GovernanceProposalAction[]): boolean {
  if (!actions.length || actions.length > GOVERNANCE_PROPOSE_MAX_ACTIONS) return false;
  return actions.every(
    (a) => validateGovernanceTargetAddress(a.targetAddress) && validateGovernanceCalldataHex(a.calldataHex),
  );
}

export function governanceProposeArgsFromDraft(draft: GovernanceProposalCreateDraft): {
  targets: `0x${string}`[];
  values: bigint[];
  calldatas: Hex[];
  description: string;
} | null {
  const actions = governanceDraftActions(draft);
  if (!validateGovernanceProposalActions(actions)) return null;
  const targets: `0x${string}`[] = [];
  const values: bigint[] = [];
  const calldatas: Hex[] = [];
  for (const a of actions) {
    const value = parseGovernanceEthValue(a.ethValue);
    if (value === null) return null;
    targets.push(a.targetAddress.trim() as `0x${string}`);
    values.push(value);
    calldatas.push(a.calldataHex.trim() as Hex);
  }
  return { targets, values, calldatas, description: governanceProposalDescription(draft) };
}

export function syncDraftPrimaryAction(draft: GovernanceProposalCreateDraft): GovernanceProposalCreateDraft {
  const first = draft.actions[0];
  if (!first) return draft;
  return {
    ...draft,
    targetAddress: first.targetAddress,
    calldataHex: first.calldataHex,
    ethValue: first.ethValue,
  };
}

export function governanceProposalDescription(draft: GovernanceProposalCreateDraft): string {
  const title = draft.title.trim();
  const summary = draft.summary.trim();
  if (title && summary) return `${title}\n\n${summary}`;
  return title || summary;
}

export function validateGovernanceTargetAddress(raw: string): boolean {
  const v = raw.trim();
  return v.length > 0 && isAddress(v);
}

export function validateGovernanceCalldataHex(raw: string): boolean {
  const v = raw.trim();
  if (!v) return false;
  if (v === "0x") return true;
  return isHex(v);
}

export function parseGovernanceEthValue(raw: string): bigint | null {
  const v = raw.trim();
  if (!v || v === "0") return BigInt(0);
  try {
    if (v.startsWith("0x")) return BigInt(v);
    return BigInt(v);
  } catch {
    return null;
  }
}

export function deriveGovernanceProposalRiskTags(
  draft: GovernanceProposalCreateDraft,
  contracts: {
    treasury_address?: string | null;
    fee_router_address?: string | null;
    governor_address?: string | null;
    timelock_address?: string | null;
  } | null,
): GovernanceProposalRiskTag[] {
  const tags: GovernanceProposalRiskTag[] = [];
  const target = draft.targetAddress.trim().toLowerCase();
  if (!target) return tags;

  const eq = (a?: string | null) => (a ? a.trim().toLowerCase() === target : false);

  if (draft.templateId === "treasury" || eq(contracts?.treasury_address)) tags.push("treasury");
  if (eq(contracts?.fee_router_address)) tags.push("fee_router");
  if (eq(contracts?.governor_address)) tags.push("governor");
  if (eq(contracts?.timelock_address)) tags.push("timelock");
  if (draft.templateId === "region") tags.push("multi_region");
  if (draft.templateId === "custom" || draft.advancedMode) tags.push("custom_call");

  return [...new Set(tags)];
}

export function governanceCreateStepIndex(step: GovernanceCreateStepId): number {
  return GOVERNANCE_CREATE_STEPS.indexOf(step);
}

export function canAdvanceGovernanceCreateStep(step: GovernanceCreateStepId, draft: GovernanceProposalCreateDraft): boolean {
  switch (step) {
    case "template":
      return Boolean(draft.templateId);
    case "details":
      return draft.title.trim().length >= 4 && draft.summary.trim().length >= 8;
    case "action":
      return validateGovernanceProposalActions(governanceDraftActions(draft));
    case "risk":
      return true;
    case "submit":
      return canAdvanceGovernanceCreateStep("action", draft) && canAdvanceGovernanceCreateStep("details", draft);
    default:
      return false;
  }
}

export function defaultTargetHintForTemplate(
  templateId: GovernanceProposalTemplateId,
  contracts: {
    treasury_address?: string | null;
    governor_address?: string | null;
    timelock_address?: string | null;
  } | null,
): string {
  switch (templateId) {
    case "treasury":
      return contracts?.treasury_address?.trim() ?? "";
    case "platform_params":
      return contracts?.governor_address?.trim() ?? "";
    case "region":
      return contracts?.timelock_address?.trim() ?? "";
    default:
      return "";
  }
}
