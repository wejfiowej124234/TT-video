import { describe, expect, it } from "vitest";

import fs from "node:fs";

import path from "node:path";



describe("stakingPageL5.contract (① · experience dark shell)", () => {

  it("uses WorkspaceL5PageShell, deployment probe, and API stake fallback", () => {

    const page = fs.readFileSync(path.join(process.cwd(), "app/staking/page.tsx"), "utf8");

    const l5 = fs.readFileSync(path.join(process.cwd(), "lib/staking/stakingPageL5.ts"), "utf8");

    const contractPanel = fs.readFileSync(

      path.join(process.cwd(), "components/staking/StakingContractPanel.tsx"),

      "utf8",

    );



    expect(page).toContain("WorkspaceL5PageShell");

    expect(page).toContain("WorkspaceL5Header");

    expect(page).toContain('PANEL_VARIANT = "warm"');

    expect(page).toContain("StakingL5CrossNav");

    expect(page).toContain("StakingWalletConnectPrompt");
    expect(page).toContain("StakingGuideIdentityWorkbench");
    expect(
      fs.readFileSync(
        path.join(process.cwd(), "components/staking/StakingGuideIdentityWorkbench.tsx"),
        "utf8",
      ),
    ).toContain("StakingIdentitySummaryStrip");
    expect(
      fs.readFileSync(
        path.join(process.cwd(), "components/staking/StakingIdentitySummaryStrip.tsx"),
        "utf8",
      ),
    ).not.toContain("staking_contract_topUpToMin");
    expect(
      fs.readFileSync(
        path.join(process.cwd(), "components/staking/StakingGuideIdentityWorkbench.tsx"),
        "utf8",
      ),
    ).toContain("suppressBelowMinHint");
    expect(
      fs.readFileSync(
        path.join(process.cwd(), "components/staking/StakingGuideIdentityWorkbench.tsx"),
        "utf8",
      ),
    ).toContain("StakingApiChainMismatchBanner");
    expect(
      fs.readFileSync(
        path.join(process.cwd(), "components/staking/StakingGuideIdentityWorkbench.tsx"),
        "utf8",
      ),
    ).toContain("StakingWrongChainNote");
    expect(
      fs.readFileSync(
        path.join(process.cwd(), "components/staking/StakingGuideIdentityWorkbench.tsx"),
        "utf8",
      ),
    ).toContain("StakingTechnicalDetailsCollapsible");
    expect(
      fs.readFileSync(path.join(process.cwd(), "components/staking/StakingStakePanel.tsx"), "utf8"),
    ).toContain("StakingGuideTierSelector");
    expect(
      fs.readFileSync(path.join(process.cwd(), "components/staking/StakingWalletConnectPrompt.tsx"), "utf8"),
    ).not.toContain('from "@/components/trust/WalletStatusMini"');
    expect(
      fs.readFileSync(path.join(process.cwd(), "components/staking/StakingWalletConnectPrompt.tsx"), "utf8"),
    ).toContain("staking_connect_use_header_wallet");

    expect(page).toContain("StakingWalletGateProvider");

    expect(page).toContain("StakingStakePrefillProvider");

    expect(page).not.toContain('{t("staking_guide_scope_intro")}');

    expect(page).toContain('messageKey="staking_guide_scope_intro"');
    expect(page).toContain("scrollToStakeOnConnect");
    expect(
      fs.readFileSync(path.join(process.cwd(), "components/staking/StakingL5CrossNav.tsx"), "utf8"),
    ).toContain("data-tt-staking-disclaimer");
    expect(
      fs.readFileSync(path.join(process.cwd(), "components/staking/StakingRegistryCollapsible.tsx"), "utf8"),
    ).toContain("StakingRegistryEligibilityBadge");

    expect(page).toContain('footerTarget="guide"');

    expect(page).toContain("StakingRegistryCollapsible");



    const errorPage = fs.readFileSync(path.join(process.cwd(), "app/staking/error.tsx"), "utf8");

    expect(errorPage).toContain("WorkspaceL5PageShell");

    expect(errorPage).toContain("StakingL5CrossNav");

    expect(errorPage).not.toContain("ProductCrossNav");

    expect(errorPage).toContain('data-tt-staking-error-l5="1"');



    const registryPanel = fs.readFileSync(

      path.join(process.cwd(), "components/staking/StakingRegistryPanel.tsx"),

      "utf8",

    );

    expect(registryPanel).toContain("StakingPanelDisconnectedState");



    const ui = fs.readFileSync(path.join(process.cwd(), "lib/uiSystem.ts"), "utf8");

    expect(ui).toContain('"/staking"');

    expect(page).toContain("data-tt-staking-provider-pools");

    expect(l5).toContain("traveltrustExperienceL5ShellDataAttrs");

    expect(l5).toContain("TT_WORKSPACE_L5.pageShell");
    expect(l5).toContain("txConfirmCard");
    expect(
      fs.readFileSync(path.join(process.cwd(), "components/staking/StakingTxFacts.tsx"), "utf8"),
    ).toContain('data-tt-staking-tx-confirm="1"');

    expect(contractPanel).toContain("StakingApiStakeSummary");

    expect(contractPanel).toContain("StakingContractAddressRow");

    expect(contractPanel).toContain("staking_contract_topUpToMin");

    expect(

      fs.readFileSync(path.join(process.cwd(), "lib/staking/stakingContractDeployment.ts"), "utf8"),

    ).toContain("useBytecode");

  });

});

