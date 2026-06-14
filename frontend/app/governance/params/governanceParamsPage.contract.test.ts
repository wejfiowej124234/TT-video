import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GOVERNANCE_PARAMS_PAGE_L5_LOCALE_KEYS } from "./governanceParamsPageModel";

const __dir = dirname(fileURLToPath(import.meta.url));

function readGovernanceParamsModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsParticipatePanel.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsQueryProvider.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsStewardBackLink.tsx"), "utf8"),
    readFileSync(join(__dir, "useGovernanceParamsPage.ts"), "utf8"),
    readFileSync(join(__dir, "governanceParamsPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsPageFooterNav.tsx"), "utf8"),
    readFileSync(join(__dir, "loading.tsx"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "components", "governance", "GovernanceParamsL5Shell.tsx"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib", "governance", "governanceParamsPageL5.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib", "governance", "governanceParamsPageL5Ui.tsx"), "utf8"),
    readFileSync(
      join(__dir, "..", "..", "..", "lib", "governance", "governanceParamsPageL5ClosureSprintModel.ts"),
      "utf8",
    ),
  ].join("\n");
}

describe("governance params page (C-GOV-011 · 84 doc mirror read-only L5)", () => {
  const src = readGovernanceParamsModuleSources();

  it("page delegates to GovernanceParamsPageMain (no inline fetch duplicate)", () => {
    expect(readFileSync(join(__dir, "page.tsx"), "utf8")).toContain("GovernanceParamsPageMain");
    expect(readFileSync(join(__dir, "page.tsx"), "utf8")).not.toContain("fetchJsonWithApiStatusLog");
  });

  it("loads protocol-reference + pending via registered routes only", () => {
    expect(src).toContain("routes.governanceProtocolReference");
    expect(src).toContain("routes.governanceProtocolReferencePending");
    expect(src).toContain("fetchJsonWithApiStatusLog");
    expect(src).toContain("protocolReferenceHasSubstance");
    expect(src).toContain("buildFeeMetricDiffRows");
  });

  it("uses homepage-aligned warm cinematic shell (同源 / + /orders)", () => {
    expect(src).toContain("GovernanceParamsL5Shell");
    expect(src).toContain("GovernanceParamsL5Panel");
    expect(src).toContain("GovernanceProposalsPageHeader");
    expect(src).toContain("pageShell");
    expect(src).toContain("pageVignette");
    expect(src).toContain("data-tt-governance-params-l5");
    expect(src).toContain("TT-GOV-PARAMS-L5-2026-06");
  });

  it("keeps data-scope banner, steward back-link, and params-specific notice", () => {
    expect(src).toContain('data-testid="governance-params-p553-data-scope"');
    expect(src).toContain("GovernanceParamsStewardBackLink");
    expect(src).toContain("steward_workbench");
    expect(src).toContain("governance_params_page_notice");
    expect(src).not.toContain("governance_hub_target_notice");
    expect(readFileSync(join(__dir, "GovernanceParamsPageMain.tsx"), "utf8")).not.toContain("ConversionFunnelRail");
    expect(src).toContain("GovernanceParamsParticipatePanel");
    expect(src).toContain("GovernanceParamsChecksumDetails");
  });

  it("surfaces mismatch gate→action and customer match reassurance", () => {
    expect(src).toContain("governance_params_mismatch_cta_proposals");
    expect(src).toContain('href="/governance/proposals"');
    expect(src).toContain("governance_params_match_customer_ok");
  });

  it("documents L5 locale keys in model for i18n parity", () => {
    for (const key of GOVERNANCE_PARAMS_PAGE_L5_LOCALE_KEYS) {
      expect(src).toContain(key);
    }
  });
});
