import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("governance fee-routes page (C-GOV-007 · projection read-only)", () => {
  const src = readFileSync(join(__dir, "page.tsx"), "utf8");

  it("loads fee-routes via registered governance API route only", () => {
    expect(src).toContain("routes.governanceFeeRoutes");
    expect(src).toContain("fetchJsonWithApiStatusLog");
    expect(src).not.toMatch(/items\s*=\s*\[\s*\{[^}]*tx_hash/);
  });

  it("surfaces meta wiring and mismatch without fabricating on-chain totals", () => {
    expect(src).toContain("governance_fee_routes_wiring");
    expect(src).toContain("rawFeeRouterFromMeta");
    expect(src).toContain("feeRouterEnvMetaMismatch");
    expect(src).toContain("governance_fee_routes_wiring_contracts_absent");
  });

  it("keeps pagination cursor honest (note / load-more errors)", () => {
    expect(src).toContain("next_cursor");
    expect(src).toContain("loadMoreError");
    expect(src).toContain("governanceFeeRoutesLoadMoreHintId");
  });
});
