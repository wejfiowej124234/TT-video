import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONSUMER_TRIP_CURRENCY_LOCALE_KEY,
} from "../escrowOrderAmountSsot";
import {
  L5_CONSISTENCY_AUDIT_ID,
  L5_CONSISTENCY_BANNED_ORDER_DETAIL_DRIFT,
  L5_CONSISTENCY_CONSUMER_AMOUNT_SURFACES,
  L5_CONSISTENCY_FINDINGS,
  L5_CONSISTENCY_LOCALE_KEYS,
  L5_CONSISTENCY_OPEN_P0,
  L5_CONSISTENCY_OPEN_P1,
  L5_CONSISTENCY_ORDER_DETAIL_CTA_KEYS,
} from "./l5ConsistencySystemIntegrityAuditModel";

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

describe("L5 Consistency & System Integrity Audit Program", () => {
  it("registers program and zero open P0/P1", () => {
    expect(L5_CONSISTENCY_AUDIT_ID).toContain("l5-consistency-system-integrity-audit");
    expect(L5_CONSISTENCY_FINDINGS.length).toBeGreaterThanOrEqual(12);
    expect(L5_CONSISTENCY_OPEN_P0).toHaveLength(0);
    expect(L5_CONSISTENCY_OPEN_P1).toHaveLength(0);
  });

  it("findings matrix markdown documents consistency standard", () => {
    const md = read("evidence/L5-CONSISTENCY-SYSTEM-INTEGRITY-MATRIX.md");
    expect(md).toContain("Consistency");
    expect(md).toContain("System Integrity");
    expect(md).toContain("P0");
    expect(md).toContain("P1");
    expect(md).toContain("美元估算");
  });

  it("consistency locale keys avoid order-detail naming drift", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of L5_CONSISTENCY_LOCALE_KEYS) {
        const value = extractLocaleValue(src, key);
        expect(value.length, `${localeFile}:${key}`).toBeGreaterThan(2);
        expect(value, `${localeFile}:${key}`).not.toMatch(L5_CONSISTENCY_BANNED_ORDER_DETAIL_DRIFT);
      }
    }
  });

  it("pay/header nav labels align on trip payment", () => {
    const zh = read("locales/zh.ts");
    expect(extractLocaleValue(zh, "header_payHub")).toBe(extractLocaleValue(zh, "pay_pageTitle"));
    const en = read("locales/en.ts");
    expect(extractLocaleValue(en, "header_payHub")).toBe(extractLocaleValue(en, "pay_pageTitle"));
  });

  it("order-detail CTAs use consistent consumer wording (zh)", () => {
    const zh = read("locales/zh.ts");
    for (const key of L5_CONSISTENCY_ORDER_DETAIL_CTA_KEYS) {
      const value = extractLocaleValue(zh, key);
      expect(value, key).toMatch(/订单详情|返回订单详情|查看订单详情/);
    }
  });

  it("consumer amount surfaces share traveler_quote_currency SSOT", () => {
    expect(CONSUMER_TRIP_CURRENCY_LOCALE_KEY).toBe("traveler_quote_currency");
    for (const rel of L5_CONSISTENCY_CONSUMER_AMOUNT_SURFACES) {
      const src = read(rel);
      const usesSsot =
        src.includes("traveler_quote_currency") || src.includes("CONSUMER_TRIP_CURRENCY_LOCALE_KEY");
      expect(usesSsot, rel).toBe(true);
    }
  });

  it("escrow page title/meta/breadcrumb agree on order details", () => {
    const zh = read("locales/zh.ts");
    expect(extractLocaleValue(zh, "escrow_meta_title")).toContain("订单详情");
    expect(extractLocaleValue(zh, "escrow_breadcrumb_current")).toBe("订单详情");
    expect(extractLocaleValue(zh, "orders_escrowDetail")).toBe("订单详情");
  });
});
