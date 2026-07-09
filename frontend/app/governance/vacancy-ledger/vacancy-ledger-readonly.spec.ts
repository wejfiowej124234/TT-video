import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("governance vacancy-ledger transparency page (W4a read-only)", () => {
  const src = readFileSync(join(__dir, "page.tsx"), "utf8");
  const model = readFileSync(
    join(__dir, "../../../lib/governance/vacancyLedgerTransparencyModel.ts"),
    "utf8",
  );

  it("loads vacancy ledger via registered governance API only", () => {
    expect(src).toContain("routes.governanceVacancyLedger");
    expect(src).toContain("fetchJsonWithApiStatusLog");
    expect(src).not.toMatch(/eth_call|cast call|web3|ethers|viem/i);
    expect(src).not.toMatch(/principal\s*-\s*swept|swept\s*-\s*disbursed|principal\s*-\s*.*disbursed/i);
  });

  it("surfaces runtime pending and protocol transparency fields", () => {
    expect(src).toContain("runtimeStatus");
    expect(src).toContain("protocolStatus");
    expect(src).toContain("governance_vacancy_ledger_runtime_pending_notice");
    expect(src).toContain("reconcileStatus");
    expect(src).toContain("dataSource");
  });

  it("has no write/admin mutation entry points", () => {
    expect(src).not.toMatch(/method:\s*['"]POST['"]|method:\s*['"]PUT['"]|method:\s*['"]PATCH['"]|method:\s*['"]DELETE['"]/);
    expect(src).not.toContain("/api/v1/admin/");
    expect(src).not.toMatch(/type=['"]submit['"].*disburse|sweepEnabled.*set/i);
  });

  it("model formats atomic USDC without reserve recompute", () => {
    expect(model).toContain("formatVacancyUsdcAtomic");
    expect(model).not.toMatch(/reserve\s*=|principal\s*-/);
  });
});
