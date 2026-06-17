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
    readFileSync(join(__dir, "GovernanceParamsFeeRouterTechnicalSection.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsOverviewSection.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsRulesAtAGlance.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsGlobalTreasuryUsageSection.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsTreasuryPolicySection.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsGovFreezeRulesSection.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsTtgSupplyStructureSection.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsProfitFlowVisual.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsTechnicalAppendixSection.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsTtgBeyondCountriesSection.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsStewardContextPanel.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsCountriesTableLegend.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsPhase1CountriesTables.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceParamsPhase1IndependentParamsDetails.tsx"), "utf8"),
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

  it("phase1 table cross-checks 84 fee points with protocol-ssot seat stake", () => {
    const split = readFileSync(join(__dir, "GovernanceParamsPhase1CountriesTables.tsx"), "utf8");
    expect(split).toContain("resolvePhase1CountryProtocolStake");
    expect(split).not.toContain("governance_params_col_cap_wan");
    expect(split).not.toContain("national_pool_cap_fee_points");
    expect(split).toContain("data-tt-governance-params-phase1-split-tables");
    expect(readFileSync(join(__dir, "GovernanceParamsPageMain.tsx"), "utf8")).toContain(
      "GovernanceParamsPhase1CountriesTables",
    );
    expect(src).toContain("GovernanceParamsOverviewSection");
    expect(src).toContain("data-tt-governance-params-overview");
    expect(src).toContain("GovernanceParamsRulesAtAGlance");
    expect(src).toContain("data-tt-governance-params-rules-glance");
    expect(src).toContain("GovernanceParamsGlobalTreasuryUsageSection");
    expect(src).toContain('id="gov-params-allocation-detail"');
    expect(src).toContain('id="gov-params-global-treasury"');
    expect(src).toContain("GovernanceParamsTreasuryPolicySection");
    expect(src).toContain('id="gov-params-treasury-policy"');
    expect(src).toContain("governance_params_treasury_policy_lead");
    expect(src).toContain("GovernanceParamsGovFreezeRulesSection");
    expect(src).toContain('id="gov-params-tokenomics-freeze"');
    expect(src).toContain("governance_params_tokenomics_freeze_section_title");
    expect(src).toContain("GovernanceParamsTtgSupplyStructureSection");
    expect(src).toContain('id="gov-params-ttg-supply"');
    expect(src).toContain("GovernanceParamsTtgBeyondCountriesSection");
    expect(src).toContain('id="gov-params-ttg-global-usage"');
    expect(src).toContain("governance_params_ttg_global_usage_section_title");
    expect(src).toContain("GovernanceParamsTechnicalAppendixSection");
    expect(readFileSync(join(__dir, "GovernanceParamsOverviewSection.tsx"), "utf8")).not.toContain(
      "GovernanceParamsProfitFlowVisual",
    );
    expect(src).toContain("data-tt-governance-params-technical-appendix");
    expect(src).toContain("governance_params_fee_routing_not_product_model");
    expect(src).not.toContain("governance_params_fee_split_global_lead");
    expect(src).toContain("governance_params_overview_foundation_title");
    expect(src).toContain("governance_params_dual_track_disclaimer");
    expect(src).toContain("GovernanceParamsCountriesTableLegend");
    expect(src).toContain("governance_params_phase1_legend_title");
    expect(readFileSync(join(__dir, "GovernanceParamsFeeRouterTechnicalSection.tsx"), "utf8")).not.toContain(
      "governance_params_dual_track_disclaimer",
    );
    expect(src).not.toContain("governance_params_country_revenue_model_title");
    expect(src).toContain("governance_params_allocation_detail_title");
    expect(src).toContain("governance_params_section_nav_allocation");
    expect(src).toContain("governance_params_glance_step1_kicker");
    expect(src).toContain("governance_params_treasury_section_title");
    expect(src).toContain("governance_params_phase1_table_bridge");
    expect(src).toContain("data-tt-governance-params-section-nav-active");
    expect(src).toContain("data-tt-governance-params-countries-mobile");
    expect(src).not.toContain("data-tt-governance-params-global-pool-mobile");
    expect(src).toContain("GovernanceParamsStewardContextPanel");
    expect(src).toContain("data-tt-governance-params-steward-context");
    expect(src).toContain("governance_params_fee_split_lead");
    expect(src).not.toContain("governance_params_fee_split_kicker");
    expect(src).toContain('data-tt-governance-params-fee-split-track="d4555-a"');
    expect(src).toContain("applyGovernanceFundraiseTargetToRows");
    expect(readFileSync(join(__dir, "GovernanceParamsPhase1IndependentParamsDetails.tsx"), "utf8")).not.toContain(
      "data-tt-governance-params-phase1-formulas",
    );
    expect(readFileSync(join(__dir, "GovernanceParamsPhase1IndependentParamsDetails.tsx"), "utf8")).toContain(
      "governance_params_phase1_independent_formula_deprecated_note",
    );
  });
});
