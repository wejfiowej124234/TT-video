import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("governance distribution-claim page (P5-4-1 contract)", () => {
  const src = readFileSync(join(__dir, "page.tsx"), "utf8");

  it("does not fetch internal API routes", () => {
    expect(src).not.toMatch(/\/api\/v1\/internal\//);
    expect(src).not.toContain("routes.internal");
  });

  it("does not invoke registerAccrual as a wallet write", () => {
    expect(src).not.toMatch(/functionName:\s*["']registerAccrual["']/);
  });
});
