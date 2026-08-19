import { describe, expect, it } from "vitest";

import zh from "@/locales/zh";

/** v6 §3 字数预算（① 本地机读粗检；手验仍以 redesign spec 为准） */
const V6_COPY_KEYS = {
  tagline: 18,
  chip: 6,
  roleTag: 4,
  startTitle: 14,
  footerT2: 40,
} as const;

function hanCount(s: string): number {
  return [...s].filter((c) => /[\u4e00-\u9fff]/.test(c)).length;
}

describe("traveltrust v6 copy budget (zh)", () => {
  it("keeps hero tagline within budget", () => {
    expect(hanCount(zh.traveltrust_tagline)).toBeLessThanOrEqual(V6_COPY_KEYS.tagline);
  });

  it("keeps trust chips within budget", () => {
    for (const key of [
      "traveltrust_trust_chip_escrow",
      "traveltrust_trust_chip_governance",
      "traveltrust_trust_chip_compliance",
    ] as const) {
      expect(hanCount(zh[key])).toBeLessThanOrEqual(V6_COPY_KEYS.chip);
    }
  });

  it("keeps role one-word tags within budget", () => {
    for (const key of [
      "traveltrust_role_traveler_tag",
      "traveltrust_role_guide_tag",
      "traveltrust_role_merchant_tag",
      "traveltrust_role_acquisition_tag",
      "traveltrust_role_steward_tag",
    ] as const) {
      expect(hanCount(zh[key])).toBeLessThanOrEqual(V6_COPY_KEYS.roleTag);
    }
  });

  it("keeps start title and footer T2 within budget", () => {
    expect(hanCount(zh.traveltrust_start_title)).toBeLessThanOrEqual(V6_COPY_KEYS.startTitle);
    expect(hanCount(zh.traveltrust_footer_t2)).toBeLessThanOrEqual(V6_COPY_KEYS.footerT2);
  });

  it("does not use legacy long intro on v6 keys", () => {
    expect(zh.traveltrust_hero_kicker).not.toMatch(/早鸟/);
    expect(zh.traveltrust_tagline.length).toBeLessThan(zh.traveltrust_intro.length);
  });

  it("uses Chinese-first title on zh surface", () => {
    expect(zh.traveltrust_title).toMatch(/网络$/);
    expect(zh.traveltrust_title).not.toMatch(/^TravelTrust/);
  });
});
