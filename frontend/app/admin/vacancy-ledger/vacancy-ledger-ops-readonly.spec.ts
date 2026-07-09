import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin vacancy-ledger ops console (W4b read-only)", () => {
  const src = readFileSync(join(__dir, "AdminVacancyLedgerOpsPageMain.tsx"), "utf8");

  it("loads ops data via admin API only", () => {
    expect(src).toContain("routes.adminVacancyLedgerOps");
    expect(src).not.toMatch(/eth_call|web3|ethers|viem/i);
    expect(src).not.toMatch(/principal\s*-\s*swept|reserve\s*=|principal\s*-/i);
  });

  it("surfaces reconciliation and indexer health panels", () => {
    expect(src).toContain("data-tt-admin-vacancy-ops-reconcile");
    expect(src).toContain("data-tt-admin-vacancy-ops-indexer");
    expect(src).toContain("reconciliation?.reconcileStatus");
    expect(src).toContain("indexerHealth?.lagBlocks");
  });

  it("shows runtime capability and has no write actions", () => {
    expect(src).toContain("runtimeCapability");
    expect(src).toContain("admin_vacancy_ledger_ops_runtime_pending");
    expect(src).not.toMatch(/method:\s*['"]POST['"]|method:\s*['"]PUT['"]|method:\s*['"]PATCH['"]|method:\s*['"]DELETE['"]/);
    expect(src).not.toMatch(/upgradeTo|setDisburse|executeSweep|disburse\(/i);
    expect(src).not.toContain("type=\"submit\"");
  });

  it("links to governance transparency view", () => {
    expect(src).toContain("/governance/vacancy-ledger");
    expect(src).toContain("data-tt-admin-vacancy-ops-governance-link");
  });
});
