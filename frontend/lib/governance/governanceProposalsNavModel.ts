/** `/governance/proposals*` 子页导航 · 保留 `from=steward_workbench` 查询 */
export function governanceProposalsListHref(from: string | null | undefined): string {
  if (from === "steward_workbench") return "/governance/proposals?from=steward_workbench";
  return "/governance/proposals";
}

export const GOVERNANCE_PROPOSAL_CREATE_FROM_STEWARD_HREF =
  "/governance/proposals/new?from=steward_workbench" as const;
