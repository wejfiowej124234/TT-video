import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TRAVELER_CONVERSION_BANNED_COPY,
  TRAVELER_CONVERSION_FINDINGS,
  TRAVELER_CONVERSION_LOCALE_KEYS,
  TRAVELER_CONVERSION_OPEN_P0,
  TRAVELER_CONVERSION_OPEN_P1,
  TRAVELER_CONVERSION_PAGES,
  TRAVELER_CONVERSION_SPRINT_ID,
} from "./travelerConversionExcellenceSprintModel";

const feRoot = join(__dirname, "..");

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

describe("Traveler Conversion Excellence Sprint", () => {
  it("registers six-page sprint and zero open P0/P1", () => {
    expect(TRAVELER_CONVERSION_SPRINT_ID).toContain("traveler-conversion-excellence");
    expect(TRAVELER_CONVERSION_PAGES.map((p) => p.id)).toEqual([
      "home",
      "preview",
      "order_detail",
      "market",
      "guide_detail",
      "pay",
    ]);
    expect(TRAVELER_CONVERSION_FINDINGS.length).toBeGreaterThanOrEqual(6);
    expect(TRAVELER_CONVERSION_OPEN_P0).toHaveLength(0);
    expect(TRAVELER_CONVERSION_OPEN_P1).toHaveLength(0);
  });

  it("each page defines goal · primary CTA · next step keys", () => {
    for (const page of TRAVELER_CONVERSION_PAGES) {
      expect(page.goalKey.length, page.id).toBeGreaterThan(3);
      expect(page.primaryCtaKey.length, page.id).toBeGreaterThan(3);
      expect(page.nextStepKey.length, page.id).toBeGreaterThan(3);
      expect(page.outcomeKey.length, page.id).toBeGreaterThan(3);
    }
  });

  it("conversion locale keys avoid protocol/ops jargon (zh + en)", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of TRAVELER_CONVERSION_LOCALE_KEYS) {
        const value = extractLocaleValue(src, key);
        expect(value.length, `${localeFile}:${key}`).toBeGreaterThan(0);
        expect(value, `${localeFile}:${key}`).not.toMatch(TRAVELER_CONVERSION_BANNED_COPY);
      }
    }
  });

  it("matrix documents 3-second clarity standard", () => {
    const md = read("evidence/TRAVELER-CONVERSION-EXCELLENCE-SPRINT-MATRIX.md");
    expect(md).toContain("3 秒");
    expect(md).toContain("主 CTA");
    expect(md).toContain("Conversion");
  });

  it("hides cold-start empty ops panel and FeeRouter on experience escrow", () => {
    expect(read("components/consumer/ConsumerSurfaceStatePanel.tsx")).toContain("return null");
    const factory = read("components/escrow/EscrowDetail/CreateOnChainEscrowBlock.tsx");
    expect(factory).toContain("{!variantExperience ? <FeeRouterWiringNotice /> : null}");
  });

  it("guide detail uses platform verified not DID label", () => {
    const zh = read("locales/zh.ts");
    expect(extractLocaleValue(zh, "guide_detail_didVerified")).toBe("平台认证");
    expect(extractLocaleValue(zh, "guide_card_didVerified")).toBe("平台认证");
  });

  it("guide detail route wires L5 shell not legacy credentials page", () => {
    const page = read("app/guides/[id]/page.tsx");
    expect(page).toContain("GuideDetailPageMain");
    expect(page).not.toContain("guideDetail_credentials");
    expect(page).not.toContain("GuideDetailCredentialCard");
    const loaded = read("app/guides/[id]/GuideDetailPageLoaded.tsx");
    expect(loaded).toContain('data-tt-traveler-conversion="guide-detail"');
  });
});
