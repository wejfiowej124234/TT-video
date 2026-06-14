import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("governance proposals list (Task A-1 · chain exec status)", () => {
  const pageSrc = readFileSync(join(__dir, "page.tsx"), "utf8");
  const layoutSrc = readFileSync(join(__dir, "layout.tsx"), "utf8");
  const mainSrc = readFileSync(join(__dir, "GovernanceProposalsPageMain.tsx"), "utf8");
  const hookSrc = readFileSync(join(__dir, "useGovernanceProposalsPage.ts"), "utf8");

  it("page delegates to GovernanceProposalsPageMain", () => {
    expect(pageSrc).toContain("GovernanceProposalsPageMain");
  });

  it("loads per-proposal status via getGovernanceProposalStatus (no list item.status fallback)", () => {
    expect(hookSrc).toContain("getGovernanceProposalStatus");
    expect(hookSrc).toContain("getGovernanceProposal");
    expect(hookSrc).toContain("getAuthHeaders");
    expect(mainSrc).toContain("GovernanceProposalListCard");
    expect(hookSrc).toContain("row.data_source");
    expect(hookSrc).toContain("row.note");
    expect(mainSrc).not.toMatch(/p\.status/);
  });

  it("L5 toolbar includes create proposal route", () => {
    const shellSrc = readFileSync(
      join(__dir, "..", "..", "..", "components", "governance", "GovernanceProposalsL5Shell.tsx"),
      "utf8",
    );
    const listL5Src = readFileSync(
      join(__dir, "..", "..", "..", "lib", "governance", "governanceProposalsListL5.ts"),
      "utf8",
    );
    expect(mainSrc).toContain("/governance/proposals/new");
    expect(mainSrc).toContain("GovernanceProposalsToolbar");
    expect(mainSrc).toContain("GovernanceProposalListCard");
    expect(listL5Src).toContain("data-tt-governance-proposals-l5");
    expect(shellSrc).toContain("governanceProposalsL5MainDataAttrs");
    expect(mainSrc).toContain("GOV_PROPOSALS_L5");
    expect(mainSrc).toContain("GovernanceProposalsL5Shell");
    expect(mainSrc).toContain("GovernanceProposalsPageHeader");
    expect(layoutSrc).not.toContain("bg-gov-proposals-warm-canvas");
  });

  it("bridges list to detail with shared narrative keys and link semantics (A-09)", () => {
    const cardSrc = readFileSync(
      join(__dir, "..", "..", "..", "components", "governance", "GovernanceProposalListCard.tsx"),
      "utf8",
    );
    expect(mainSrc).toContain("GOV_EXEC_LIST_BRIDGE_DOM_ID");
    expect(mainSrc).toContain("GovExecReadOnlyI18n.listEntryBridge");
    expect(cardSrc).toContain("GovExecReadOnlyI18n.proposalLinkContinueTitle");
    expect(cardSrc).toContain("aria-describedby");
  });
});
