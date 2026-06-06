import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("governance hub page (C-GOV-001 · data_source / is_chain_ssot truth)", () => {
  it("route page delegates to GovernanceHubPageMain SSOT shell", () => {
    const src = readFileSync(join(__dir, "page.tsx"), "utf8");
    expect(src).toContain("GovernanceHubPageMain");
    expect(src).not.toContain("51-H2：治理池/奖励为占位数据");
    expect(src).not.toContain("useState<PoolRes");
  });

  it("pool section gates SSOT badge on chain_read + is_chain_ssot", () => {
    const src = readFileSync(join(__dir, "GovernanceHubPoolSection.tsx"), "utf8");
    expect(src).toContain("governancePoolIsChainReadRow(pool)");
    expect(src).toContain("pool.is_chain_ssot === true");
    expect(src).toContain("governance_chain_read_ssot_badge");
    expect(src).toContain('pool?.data_source === "database"');
    expect(src).toContain("governance_pool_placeholder");
  });

  it("rewards section labels placeholder explicitly (no fake list fabrication)", () => {
    const src = readFileSync(join(__dir, "GovernanceHubRewardsSection.tsx"), "utf8");
    expect(src).toContain('rewards?.data_source === "placeholder"');
    expect(src).toContain("governance_rewards_placeholder");
    expect(src).toContain("governance_rewards_empty");
    expect(src).not.toMatch(/useState|Math\.random/);
  });

  it("hub page model documents per-leg chain_read SSOT guards (B-110)", () => {
    const src = readFileSync(join(__dir, "governanceHubPageModel.ts"), "utf8");
    expect(src).toContain('data_source: "chain_read"');
    expect(src).toContain("governanceCountryPoolRootChainSsot");
    expect(src).toContain("governanceTreasuryPoolRootChainSsot");
    expect(src).toContain("governanceTreasuryErc20PoolRootChainSsot");
    expect(src).not.toContain("51-H2：治理池/奖励为占位数据");
  });
});
