import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../..");

describe("web3 itinerary full chain smoke gate (①)", () => {
  it("declares assignable-guide helper and resilient landing/escrow smokes", () => {
    const helper = join(repoRoot, "scripts/dev/lib/tt-patch-order-assignable-guide.sh");
    const landing = join(repoRoot, "scripts/dev/smoke-landing-itinerary-flow-local.sh");
    const escrowBind = join(repoRoot, "scripts/dev/smoke-escrow-draft-guide-bind-local.sh");
    const fullChain = join(repoRoot, "scripts/dev/smoke-web3-itinerary-full-chain-local.sh");

    for (const path of [helper, landing, escrowBind, fullChain]) {
      expect(existsSync(path), path).toBe(true);
    }

    const helperSrc = readFileSync(helper, "utf8");
    expect(helperSrc).toContain("tt_patch_order_assignable_guide");
    expect(helperSrc).toContain("POST");
    expect(helperSrc).toContain("/stake");

    const landingSrc = readFileSync(landing, "utf8");
    expect(landingSrc).toContain("tt-patch-order-assignable-guide.sh");
    expect(landingSrc).toContain("tt_patch_order_assignable_guide");
    expect(landingSrc).not.toContain("items[0].id");

    const escrowSrc = readFileSync(escrowBind, "utf8");
    expect(escrowSrc).toContain("tt_patch_order_assignable_guide");

    const fullSrc = readFileSync(fullChain, "utf8");
    expect(fullSrc).toContain("smoke-landing-itinerary-flow-local.sh");
    expect(fullSrc).toContain("smoke-escrow-draft-guide-bind-local.sh");
    expect(fullSrc).toContain("TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE: OK");
  });
});
