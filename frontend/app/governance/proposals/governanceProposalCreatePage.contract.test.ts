import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(__dir, "..", "..", "..", "components", "governance");

describe("governance proposal create page (89 §四 · ①)", () => {
  const pageSrc = readFileSync(join(__dir, "new", "page.tsx"), "utf8");
  const mainSrc = readFileSync(join(__dir, "new", "GovernanceProposalCreatePageMain.tsx"), "utf8");

  it("routes /governance/proposals/new with wizard and wallet propose", () => {
    const shellSrc = readFileSync(join(componentsDir, "GovernanceProposalsL5Shell.tsx"), "utf8");
    const navSrc = readFileSync(join(componentsDir, "GovernanceProposalsSubpageNav.tsx"), "utf8");
    const walletPanelSrc = readFileSync(join(componentsDir, "GovernanceWalletConnectPanel.tsx"), "utf8");
    const chainMismatchSrc = readFileSync(join(componentsDir, "GovernanceChainMismatchActions.tsx"), "utf8");
    expect(pageSrc).toContain("GovernanceProposalCreatePageMain");
    expect(mainSrc).toContain("GovernanceProposalCreateWizard");
    expect(mainSrc).toContain("useGovernancePropose");
    expect(mainSrc).toContain('pageKind="create"');
    expect(mainSrc).toContain("GovernanceProposalsSubpageNav");
    expect(mainSrc).toContain("useGovernanceProposerPower");
    expect(mainSrc).toContain("useGovernanceProposeSimulate");
    const wizardSrc = readFileSync(join(componentsDir, "GovernanceProposalCreateWizard.tsx"), "utf8");
    expect(wizardSrc).toContain("GovernanceWalletConnectPanel");
    expect(wizardSrc).toContain("buildGovernanceTemplateActionPreset");
    expect(mainSrc).toContain("simulateHardBlock");
    expect(walletPanelSrc).toContain("GovernanceChainMismatchActions");
    expect(chainMismatchSrc).toContain("useSwitchChain");
    expect(shellSrc).toContain("data-tt-governance-proposal-create-page");
    expect(shellSrc).toContain("data-tt-ui-frozen");
    expect(navSrc).toContain("StewardWorkbenchSubpageBackLinkFromQuery");
  });
});
