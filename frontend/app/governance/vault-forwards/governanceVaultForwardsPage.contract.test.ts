import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("governance vault-forwards page (C-GOV-008 · projection read-only)", () => {
  const src = readFileSync(join(__dir, "page.tsx"), "utf8");

  it("loads vault-forwards via registered governance API route only", () => {
    expect(src).toContain("routes.governanceVaultForwards");
    expect(src).toContain("fetchJsonWithApiStatusLog");
    expect(src).not.toMatch(/items\s*=\s*\[\s*\{[^}]*vault_address/);
  });

  it("surfaces RegionVault wiring from meta without fake addresses", () => {
    expect(src).toContain("governance_vault_forwards_wiring");
    expect(src).toContain("governance_fee_routes_wiring_contracts_absent");
    expect(src).toContain("metaContractsLoaded");
    expect(src).toContain("metaVaultRaw");
  });

  it("keeps pagination and scope filter explicit", () => {
    expect(src).toContain("next_cursor");
    expect(src).toContain("scopeMetaChain");
    expect(src).toContain("governanceVaultForwardsLoadMoreHintId");
  });
});
