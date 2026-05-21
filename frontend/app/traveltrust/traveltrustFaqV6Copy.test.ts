import { describe, expect, it } from "vitest";

import en from "@/locales/en";
import zh from "@/locales/zh";

/** v6 FAQ 文案真源（防 locale 重复键覆盖 legacy 块） */
describe("traveltrust v6 FAQ copy", () => {
  it("zh FAQ q1 is v6 ICO disclaimer (not legacy escrow essay)", () => {
    expect(zh.traveltrust_faq_q1).toMatch(/ICO|发币|代币认购|证券发行/);
    expect(zh.traveltrust_faq_a1).toMatch(/Escrow|托管/);
    expect(zh.traveltrust_faq_a1).toMatch(/USDC|USDT/);
    expect(zh.traveltrust_faq_a1.length).toBeLessThan(140);
  });

  it("en FAQ q1 is v6 ICO disclaimer", () => {
    expect(en.traveltrust_faq_q1).toMatch(/ICO|token sale/i);
    expect(en.traveltrust_faq_a1).toMatch(/Escrow/i);
  });

  it("zh FAQ q6 separates TTG from trip escrow", () => {
    expect(zh.traveltrust_faq_q6).toMatch(/TTG/);
    expect(zh.traveltrust_faq_a6).toMatch(/Escrow|托管/);
    expect(zh.traveltrust_faq_a6).toMatch(/USDC|USDT/);
    expect(zh.traveltrust_faq_a6).not.toMatch(/USDC↔USDT/);
  });

  it("keeps legacy FAQ keys separate from v6 keys", () => {
    expect(zh.traveltrust_legacy_faq_q1).not.toBe(zh.traveltrust_faq_q1);
    expect(en.traveltrust_legacy_faq_q1).not.toBe(en.traveltrust_faq_q1);
  });
});
