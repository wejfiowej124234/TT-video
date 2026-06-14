import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  L5_EDGE_CASE_AUDIT_ID,
  L5_EDGE_CASE_BANNED_EXCEPTION_COPY,
  L5_EDGE_CASE_EXCEPTION_LOCALE_KEYS,
  L5_EDGE_CASE_FINDINGS,
  L5_EDGE_CASE_OPEN_P0,
  L5_EDGE_CASE_OPEN_P1,
} from "./l5EdgeCaseExceptionAuditModel";

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

describe("L5 Edge-Case & Exception Audit Program", () => {
  it("registers program and zero open P0/P1", () => {
    expect(L5_EDGE_CASE_AUDIT_ID).toContain("l5-edge-case-exception-audit");
    expect(L5_EDGE_CASE_FINDINGS.length).toBeGreaterThanOrEqual(12);
    expect(L5_EDGE_CASE_OPEN_P0).toHaveLength(0);
    expect(L5_EDGE_CASE_OPEN_P1).toHaveLength(0);
  });

  it("findings matrix markdown documents exception standard", () => {
    const md = read("evidence/L5-EDGE-CASE-EXCEPTION-AUDIT-FINDINGS-MATRIX.md");
    expect(md).toContain("Edge-Case");
    expect(md).toContain("发生了什么");
    expect(md).toContain("P0");
    expect(md).toContain("P1");
  });

  it("exception locale keys explain what happened and next step", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of L5_EDGE_CASE_EXCEPTION_LOCALE_KEYS) {
        const value = extractLocaleValue(src, key);
        expect(value.length, `${localeFile}:${key}`).toBeGreaterThan(12);
        expect(value, `${localeFile}:${key}`).not.toMatch(L5_EDGE_CASE_BANNED_EXCEPTION_COPY);
      }
    }
  });

  it("ApiErrorAlert adds retry hint for known load failures", () => {
    expect(read("components/ApiErrorAlert.tsx")).toContain("api_error_retryShort");
    expect(read("components/ApiErrorAlert.tsx")).toContain("escrow_loadFailed");
  });
});
