import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  GOVERNANCE_PARAMS_L5_BANNED_COPY,
  GOVERNANCE_PARAMS_L5_CLOSURE_FINDINGS,
  GOVERNANCE_PARAMS_L5_LOCALE_KEYS,
  GOVERNANCE_PARAMS_L5_OPEN_P0,
  GOVERNANCE_PARAMS_L5_OPEN_P1,
  GOVERNANCE_PARAMS_PAGE_L5_CLOSURE_PROBE,
  GOVERNANCE_PARAMS_PAGE_L5_FROZEN_MARKER,
  GOVERNANCE_PARAMS_PAGE_L5_UI_FROZEN,
} from "./governanceParamsPageL5ClosureSprintModel";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("governance params page L5 full closure (① local · frozen)", () => {
  it("freeze doc is ACTIVE and P0/P1 closed", () => {
    const freeze = read("evidence/GO_local_governance_params_l5/GOVERNANCE-PARAMS-L5-FREEZE.md");
    expect(freeze).toContain("冻结结论（ACTIVE）");
    expect(GOVERNANCE_PARAMS_PAGE_L5_UI_FROZEN).toBe(true);
    expect(GOVERNANCE_PARAMS_L5_OPEN_P0).toHaveLength(0);
    expect(GOVERNANCE_PARAMS_L5_OPEN_P1).toHaveLength(0);
    expect(GOVERNANCE_PARAMS_L5_CLOSURE_FINDINGS.filter((f) => f.status === "open")).toHaveLength(0);
  });

  it("locale keys exist and avoid banned copy on customer-facing strings", () => {
    for (const key of GOVERNANCE_PARAMS_L5_LOCALE_KEYS) {
      const zhVal = (zh as Record<string, string>)[key];
      const enVal = (en as Record<string, string>)[key];
      expect(zhVal, `zh:${key}`).toBeTruthy();
      expect(enVal, `en:${key}`).toBeTruthy();
      expect(zhVal).not.toMatch(GOVERNANCE_PARAMS_L5_BANNED_COPY);
      expect(enVal).not.toMatch(GOVERNANCE_PARAMS_L5_BANNED_COPY);
    }
  });

  it("main page wires frozen marker, section anchors, retry, and gate→proposals CTA", () => {
    const main = read("app/governance/params/GovernanceParamsPageMain.tsx");
    const shell = read("components/governance/GovernanceParamsL5Shell.tsx");
    expect(shell).toContain("GOVERNANCE_PARAMS_PAGE_L5_FROZEN_MARKER");
    expect(shell).toContain("GOVERNANCE_PARAMS_PAGE_L5_CLOSURE_PROBE");
    expect(main).toContain('id="gov-params-diff"');
    expect(main).toContain('id="gov-params-fee-split"');
    expect(main).toContain('id="gov-params-countries"');
    expect(main).toContain("GovernanceParamsSectionNav");
    expect(main).toContain("GovernanceParamsPercentBar");
    expect(main).toContain("GovernanceParamsTechnicalDetails");
    expect(main).toContain("GovernanceParamsParticipatePanel");
    expect(main).not.toContain("ConversionFunnelRail");
    expect(main).toContain("governance_params_page_notice");
    expect(main).not.toContain("governance_hub_target_notice");
    expect(main).toContain("GovernanceParamsChecksumDetails");
    expect(main).toContain("GovernanceParamsRetryButton");
    expect(main).toContain('href="/governance/proposals"');
    expect(main).toContain("resolvePhase1CountryDisplay");
  });

  it("smoke script exists and references vitest + protocol-reference API + playwright", () => {
    const smoke = read("../scripts/dev/smoke-governance-params-l5-local.sh");
    expect(smoke).toContain("governanceParamsPageL5FullClosure.contract.test.ts");
    expect(smoke).toContain("/api/v1/governance/protocol-reference");
    expect(smoke).toContain("/api/v1/governance/protocol-reference/pending");
    expect(smoke).toContain("governance-params-full-l5.spec.ts");
    expect(smoke).toContain("TT_GOVERNANCE_PARAMS_L5_SMOKE: OK");
  });

  it("closure probe constants are stable", () => {
    expect(GOVERNANCE_PARAMS_PAGE_L5_CLOSURE_PROBE).toBe("governance-params-full-v1");
    expect(GOVERNANCE_PARAMS_PAGE_L5_FROZEN_MARKER).toBe("governance-params-l5-20260612");
  });

  it("route README, enterprise audit, and AGENTS gate exist", () => {
    expect(read("app/governance/params/README.md")).toContain("GOVERNANCE-PARAMS-L5-FREEZE");
    expect(read("evidence/GO_local_governance_params_l5/GOVERNANCE-PARAMS-L5-ENTERPRISE-AUDIT.md")).toContain(
      "十维矩阵",
    );
    expect(read("../AGENTS.md")).toContain("smoke-governance-params-l5-local.sh");
  });

  it("section nav is sticky and percent bars use meter semantics", () => {
    expect(read("lib/governance/governanceParamsPageL5Ui.tsx")).toContain("sticky top-3");
    expect(read("lib/governance/governanceParamsPageL5Ui.tsx")).toContain('role="meter"');
  });
});
