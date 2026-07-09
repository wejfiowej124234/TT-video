import type { LocaleTranslateFn } from "@/lib/i18n";

/** ① 预置 starter 提案 · 固定 UUID（B-072 · e2e / 本地联调） */
export const GOVERNANCE_STARTER_PROPOSAL_IDS = {
  feeRouterParams: "00000000-0000-4000-8000-000000000001",
  treasuryRotation: "00000000-0000-4000-8000-000000000002",
} as const;

const STARTER_LOCALE_BY_ID: Record<string, { titleKey: string; bodyKey: string }> = {
  [GOVERNANCE_STARTER_PROPOSAL_IDS.feeRouterParams]: {
    titleKey: "governance_starter_proposal_1_title",
    bodyKey: "governance_starter_proposal_1_body",
  },
  [GOVERNANCE_STARTER_PROPOSAL_IDS.treasuryRotation]: {
    titleKey: "governance_starter_proposal_2_title",
    bodyKey: "governance_starter_proposal_2_body",
  },
};

function normalizeProposalId(id: string): string {
  return id.trim().toLowerCase();
}

export function isGovernanceStarterProposalId(id: string): boolean {
  return normalizeProposalId(id) in STARTER_LOCALE_BY_ID;
}

export function resolveGovernanceProposalDisplayTitle(
  proposalId: string,
  apiTitle: string | undefined | null,
  t: LocaleTranslateFn,
): string {
  const keys = STARTER_LOCALE_BY_ID[normalizeProposalId(proposalId)];
  if (keys) return t(keys.titleKey);
  if (typeof apiTitle === "string" && apiTitle.trim()) return apiTitle.trim();
  return t("governance_proposals_item_untitled");
}

export function resolveGovernanceProposalDisplayBody(
  proposalId: string,
  apiBody: string | undefined | null,
  t: LocaleTranslateFn,
): string {
  const keys = STARTER_LOCALE_BY_ID[normalizeProposalId(proposalId)];
  if (keys) return t(keys.bodyKey);
  return typeof apiBody === "string" ? apiBody : "";
}
