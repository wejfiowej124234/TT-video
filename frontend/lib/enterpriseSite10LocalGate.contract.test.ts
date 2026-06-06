import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../..");

describe("enterprise site 10 local gate (①)", () => {
  it("declares site orchestrator, runbook SSOT, and corridor sub-gate", () => {
    const script = join(repoRoot, "scripts/dev/run-enterprise-site-10-local.sh");
    const runbook = join(repoRoot, "docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md");
    const corridor = join(repoRoot, "scripts/dev/run-enterprise-local-10.sh");
    expect(existsSync(script)).toBe(true);
    expect(existsSync(runbook)).toBe(true);
    expect(existsSync(corridor)).toBe(true);
    const scriptSrc = readFileSync(script, "utf8");
    expect(scriptSrc).toContain("run-go-local-phase1-acceptance.sh");
    expect(scriptSrc).toContain("smoke-ab-core-chain.sh");
    expect(scriptSrc).toContain("run-orders-corridor-local.sh");
    expect(scriptSrc).toContain("_load_database_url_from_root_env");
    expect(scriptSrc).toContain("run-enterprise-local-10.sh");
    expect(scriptSrc).toContain("TT_ENTERPRISE_SITE_10_LOCAL:");
    const runbookSrc = readFileSync(runbook, "utf8");
    expect(runbookSrc).toContain("② 测试网");
    expect(runbookSrc).toContain("③ 生产");
    expect(runbookSrc).toContain("TT_ENTERPRISE_SITE_10_LOCAL");
    expect(runbookSrc).toContain("TT_ORDERS_CORRIDOR_LOCAL");
    expect(runbookSrc).toContain("PHASE2-START-CHECKLIST");
    expect(runbookSrc).toContain("go-live-checklist");
  });
});
