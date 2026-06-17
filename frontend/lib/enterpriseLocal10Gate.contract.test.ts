import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../..");

describe("enterprise local 10 gate (①)", () => {
  it("declares orchestrator script, E2E spec, and evidence README", () => {
    const script = join(repoRoot, "scripts/dev/run-enterprise-local-10.sh");
    const e2e = join(__dirname, "../e2e/web3-itinerary-corridor-10.spec.ts");
    const readme = join(__dirname, "../evidence/GO_local_enterprise_10/README.md");
    expect(existsSync(script)).toBe(true);
    expect(existsSync(e2e)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const scriptSrc = readFileSync(script, "utf8");
    expect(scriptSrc).toContain("run-web3-itinerary-l5-green.sh");
    expect(scriptSrc).toContain("smoke-web3-itinerary-full-chain-local.sh");
    expect(scriptSrc).toContain("web3ItineraryFullChainGate.contract.test.ts");
    expect(scriptSrc).toContain("TT_ENTERPRISE_LOCAL_10:");
    expect(scriptSrc).toContain("e2e:web3-itinerary-10");
    const fullChain = readFileSync(join(repoRoot, "scripts/dev/smoke-web3-itinerary-full-chain-local.sh"), "utf8");
    expect(fullChain).toContain("smoke-landing-itinerary-flow-local.sh");
    const landingSrc = readFileSync(join(repoRoot, "scripts/dev/smoke-landing-itinerary-flow-local.sh"), "utf8");
    expect(landingSrc).toContain("tt-order-guide-id.sh");
    expect(landingSrc).toContain("tt_assert_order_has_no_guide");
    const readmeSrc = readFileSync(readme, "utf8");
    expect(readmeSrc).toContain("① 本地");
    expect(readmeSrc).toContain("不等于");
    expect(readmeSrc).toContain("TT_ENTERPRISE_LOCAL_10");
  });
});
