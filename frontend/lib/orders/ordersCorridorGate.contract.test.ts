import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../../..");
const frontendRoot = join(repoRoot, "frontend");

describe("orders corridor gate (①)", () => {
  it("declares green script, corridor orchestrator, evidence README, and E2E npm script", () => {
    const green = join(repoRoot, "scripts/dev/run-orders-l5-green.sh");
    const corridor = join(repoRoot, "scripts/dev/run-orders-corridor-local.sh");
    const listSmoke = join(repoRoot, "scripts/dev/smoke-orders-list-local.sh");
    const payEscrowSmoke = join(repoRoot, "scripts/dev/smoke-orders-pay-escrow-local.sh");
    const record = join(repoRoot, "scripts/dev/record-orders-corridor-acceptance-log.sh");
    const readme = join(frontendRoot, "evidence/GO_local_orders_l5/README.md");
    const routeReadme = join(frontendRoot, "app/orders/README.md");
    const pkg = join(frontendRoot, "package.json");

    for (const path of [green, corridor, listSmoke, payEscrowSmoke, record, readme, routeReadme]) {
      expect(existsSync(path), path).toBe(true);
    }

    const greenSrc = readFileSync(green, "utf8");
    expect(greenSrc).toContain("ordersListL5.contract.test.ts");
    expect(greenSrc).toContain("payHubL5.contract.test.ts");
    expect(greenSrc).toContain("TT_ORDERS_L5_GREEN:");

    const corridorSrc = readFileSync(corridor, "utf8");
    expect(corridorSrc).toContain("run-orders-l5-green.sh");
    expect(corridorSrc).toContain("smoke-orders-pay-escrow-local.sh");
    expect(corridorSrc).toContain("TT_ORDERS_CORRIDOR_LOCAL:");
    expect(corridorSrc).toContain("e2e:orders-corridor");

    const recordSrc = readFileSync(record, "utf8");
    expect(recordSrc).toContain("run-orders-corridor-local.sh");
    expect(recordSrc).toContain("TT_ORDERS_CORRIDOR_LOCAL: OK");

    const readmeSrc = readFileSync(readme, "utf8");
    expect(readmeSrc).toContain("① 本地");
    expect(readmeSrc).toContain("禁止冒充");
    expect(readmeSrc).toContain("TT_ORDERS_L5_GREEN");
    expect(readmeSrc).toContain("record-orders-corridor-acceptance-log.sh");
    expect(readmeSrc).toContain("acceptance.latest.log");
    expect(readmeSrc).toContain("data-tt-orders-list-card-escrow-link");

    const pkgSrc = readFileSync(pkg, "utf8");
    expect(pkgSrc).toContain("e2e:orders-corridor");
    expect(pkgSrc).toContain("orders-list-keyboard.spec.ts");
    expect(pkgSrc).toContain("orders-list-to-escrow.spec.ts");
    expect(pkgSrc).toContain("orders-list-to-pay.spec.ts");
  });
});
