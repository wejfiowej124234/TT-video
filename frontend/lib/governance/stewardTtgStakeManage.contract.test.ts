import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("steward TTG stake manage (① · workbench SSOT)", () => {
  it("shared panel wires stake, release, resign lifecycle and dual-track UX", () => {
    const panel = read("components/steward/StewardTtgStakeManagePanel.tsx");
    expect(panel).toContain("StewardStakeJurisdictionRow");
    expect(panel).toContain("StewardStakeReleaseRow");
    expect(panel).toContain("steward-resign-notice-submit");
    expect(panel).toContain("data-tt-steward-ttg-stake-manage");
    expect(panel).toContain("data-tt-steward-dual-track");
    expect(panel).toContain("stewardShowsOnboardingCta");
  });

  it("workbench stake panel uses compact subtitle and stat tiles", () => {
    const panel = read("components/steward/StewardTtgStakeManagePanel.tsx");
    expect(panel).toContain("steward_workbench_stake_subtitle_compact");
    expect(panel).not.toContain("steward_workbench_stake_dual_track_title");
    expect(panel).toContain("hideDualTrackSummary");
    expect(panel).toContain("gateCollapsed");
    expect(panel).toContain("gateStakeCompact");
    expect(panel).toContain("data-tt-steward-ttg-stake-gate-collapsed");
    expect(panel).toContain("data-tt-steward-ttg-stake-gate-compact");
    expect(panel).toContain("data-tt-steward-ttg-stake-gate-collapsed-mode");
    expect(read("app/governance/StewardRegionWorkbenchMain.tsx")).toContain("openStakePanel");
    expect(read("app/governance/StewardRegionWorkbenchMain.tsx")).toContain("resolveStewardStakePanelCollapseMode");
  });

  it("stake jurisdiction row humanizes min stake amounts", () => {
    const row = read("components/steward/StewardStakeJurisdictionRow.tsx");
    expect(row).toContain("formatTtgAmount");
    expect(row).toContain("formatProtocolStewardStakeTtgUnits");
  });

  it("settings hub does not duplicate steward stake row", () => {
    const nav = read("lib/me/meSettingsNavModel.ts");
    expect(nav).toContain("steward_hub");
    expect(nav).not.toContain("steward_stake");
    expect(nav).not.toContain("/me/identities/region-steward/stake");
  });

  it("legacy stake URL redirects via next.config (no duplicate app route)", () => {
    const cfg = read("next.config.js");
    expect(cfg).toContain("/me/identities/region-steward/stake");
    expect(cfg).toContain("steward-ttg-stake");
  });

  it("workbench owns stake section with anchor id", () => {
    const section = read("components/governance/StewardWorkbenchTtgStakeSection.tsx");
    expect(section).toContain("STEWARD_WORKBENCH_STAKE_ANCHOR");
    expect(section).toContain("StewardTtgStakeManagePanel");
    const main = read("app/governance/StewardRegionWorkbenchMain.tsx");
    expect(main).toContain("StewardWorkbenchTtgStakeSection");
    expect(main).not.toContain("/me/identities/region-steward/stake");
  });

  it("release row exposes requestRelease and claimReleased", () => {
    const row = read("components/steward/StewardStakeReleaseRow.tsx");
    expect(row).toContain("requestRelease");
    expect(row).toContain("claimReleased");
  });

  it("steward seat model parses lifecycle flags", () => {
    const model = read("lib/steward/stewardSeatModel.ts");
    expect(model).toContain("canSubmitResignNotice");
    expect(model).toContain("canRequestChainRelease");
  });
});
