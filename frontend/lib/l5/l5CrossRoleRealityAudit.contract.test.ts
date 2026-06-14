import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  L5_CROSS_ROLE_CORE_TASKS,
  L5_CROSS_ROLE_OPEN_P0,
  L5_CROSS_ROLE_OPEN_P1,
  L5_CROSS_ROLE_REALITY_AUDIT_ID,
  L5_CROSS_ROLE_REALITY_FINDINGS,
  L5_CROSS_ROLE_BANNED_REALITY_COPY,
  L5_CROSS_ROLE_REALITY_LOCALE_KEYS,
} from "./l5CrossRoleRealityAuditModel";

const feRoot = join(__dirname, "../..");

function read(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

function extractLocaleValue(src: string, key: string): string {
  const re = new RegExp(`${key}:\\s*"([^"]*)"`, "m");
  const single = src.match(re);
  if (single?.[1]) return single[1];
  const multi = src.match(new RegExp(`${key}:\\s*\\n\\s*"([^"]*)"`, "m"));
  return multi?.[1] ?? "";
}

describe("L5 Cross-Role Reality Audit Program", () => {
  it("registers program, five roles, core tasks, and zero open P0/P1", () => {
    expect(L5_CROSS_ROLE_REALITY_AUDIT_ID).toContain("l5-cross-role-reality-audit");
    expect(L5_CROSS_ROLE_CORE_TASKS).toHaveLength(5);
    expect(L5_CROSS_ROLE_REALITY_FINDINGS.length).toBeGreaterThanOrEqual(10);
    expect(L5_CROSS_ROLE_OPEN_P0).toHaveLength(0);
    expect(L5_CROSS_ROLE_OPEN_P1).toHaveLength(0);
  });

  it("findings matrix markdown documents reality standard", () => {
    const md = read("evidence/L5-CROSS-ROLE-REALITY-AUDIT-FINDINGS-MATRIX.md");
    expect(md).toContain("Reality Audit");
    expect(md).toContain("无需培训");
    expect(md).toContain("P0");
    expect(md).toContain("P1");
    expect(md).toContain("Governance");
  });

  it("cross-role locale keys avoid placeholder and runbook jargon", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of L5_CROSS_ROLE_REALITY_LOCALE_KEYS) {
        const value = extractLocaleValue(src, key);
        expect(value.length, `${localeFile}:${key}`).toBeGreaterThan(0);
        expect(value, `${localeFile}:${key}`).not.toMatch(L5_CROSS_ROLE_BANNED_REALITY_COPY);
      }
    }
  });

  it("preview card uses order amount SSOT for reality data display", () => {
    expect(read("components/landing/ItineraryResultsSection.tsx")).toContain("resolveEscrowDisplayAmount");
  });

  it("role hub remains discoverable from header user menu", () => {
    expect(read("components/Header.test.tsx")).toContain("/me/identities");
  });
});
