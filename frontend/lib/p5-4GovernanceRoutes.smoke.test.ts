import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dir, "..");

describe("P5-4 governance routes (smoke · P5-4-3)", () => {
  it("expected app pages exist for 04 §3.4 + run-check-04-routes", () => {
    expect(
      existsSync(join(frontendRoot, "app/governance/distribution-claim/page.tsx")),
    ).toBe(true);
    expect(
      existsSync(join(frontendRoot, "app/governance/distribution-accruals/page.tsx")),
    ).toBe(true);
    expect(
      existsSync(join(frontendRoot, "app/governance/distribution-accruals/[id]/page.tsx")),
    ).toBe(true);
  });
});
