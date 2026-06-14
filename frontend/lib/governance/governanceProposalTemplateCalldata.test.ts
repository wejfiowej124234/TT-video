import { describe, expect, it } from "vitest";
import {
  buildGovernanceTemplateActionPreset,
  GOVERNANCE_TEMPLATE_DEFAULT_REVIEW_WINDOW_DAYS,
} from "@/lib/governance/governanceProposalTemplateCalldata";

const mockContracts = {
  governor_address: "0x1111111111111111111111111111111111111111",
  treasury_address: "0x2222222222222222222222222222222222222222",
  timelock_address: "0x3333333333333333333333333333333333333333",
  fee_router_address: "0x4444444444444444444444444444444444444444",
};

describe("governanceProposalTemplateCalldata", () => {
  it("encodes platform_params calldata", () => {
    const preset = buildGovernanceTemplateActionPreset("platform_params", mockContracts);
    expect(preset).not.toBeNull();
    expect(preset!.targetAddress).toBe(mockContracts.governor_address);
    expect(preset!.calldataHex).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(preset!.calldataHex.length).toBeGreaterThan(10);
    expect(preset!.humanSummaryKey).toBe("governance_create_template_calldata_platform_params");
    expect(preset!.humanSummaryVars?.days).toBe(Number(GOVERNANCE_TEMPLATE_DEFAULT_REVIEW_WINDOW_DAYS));
  });

  it("fills treasury stub target", () => {
    const preset = buildGovernanceTemplateActionPreset("treasury", mockContracts);
    expect(preset!.targetAddress).toBe(mockContracts.treasury_address);
    expect(preset!.calldataHex).toBe("0x");
  });
});
