import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";

const ROOT = join(__dirname, "../..");
const LOCALES = ["zh.ts", "en.ts"] as const;

const HELP_KEYS = [
  "help_title",
  "help_desc",
  "ui_link_nav_arrow_suffix",
] as const;

const HELP_PUBLIC_COPY_KEYS = [
  "help_desc",
  "help_meta_description",
  "help_docNote",
  "help_platformBullet3",
  "help_disputesParagraph",
  "help_faqFeeRouterA",
  "help_faqDisputeA",
] as const;

const HELP_JARGON_PATTERNS = [
  /08-4/,
  /GET\s+\/meta/i,
  /Runbook/i,
  /NEXT_PUBLIC_/,
  /FEE_ROUTER/,
  /①/,
  /createEscrow/i,
] as const;

const MARKET_PUBLIC_COPY_KEYS = ["market_empty_catalog_note"] as const;

const MARKET_JARGON_PATTERNS = [/①/, /本地已过滤/, /production/i, /test\/demo/i, /Local dev/i] as const;

function localeHasKey(src: string, key: string): boolean {
  return new RegExp(`^\\s+${key}:\\s`, "m").test(src);
}

function localeStringValue(src: string, key: string): string {
  const re = new RegExp(`^\\s+${key}:\\s*"([^"]*)"`, "m");
  const m = src.match(re);
  expect(m, `${key} string literal`).toBeTruthy();
  return m![1]!;
}

describe("help page i18n contract", () => {
  it("help module uses keys that exist in zh and en", () => {
    const page = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(page).toContain('t("ui_link_nav_arrow_suffix")');
    for (const file of LOCALES) {
      const src = readFileSync(join(ROOT, "locales", file), "utf8");
      for (const key of HELP_KEYS) {
        if (page.includes(`t("${key}")`)) {
          expect(localeHasKey(src, key), `${file} missing ${key}`).toBe(true);
        }
      }
      expect(localeHasKey(src, "ui_link_nav_arrow_suffix")).toBe(true);
    }
  });

  it("help public copy avoids operator jargon (PER B-1)", () => {
    for (const file of LOCALES) {
      const src = readFileSync(join(ROOT, "locales", file), "utf8");
      for (const key of HELP_PUBLIC_COPY_KEYS) {
        const value = localeStringValue(src, key);
        for (const pattern of HELP_JARGON_PATTERNS) {
          expect(value, `${file}.${key} must not match ${pattern}`).not.toMatch(pattern);
        }
      }
    }
  });

  it("market empty catalog note uses user language only (PER CI-12)", () => {
    for (const file of LOCALES) {
      const src = readFileSync(join(ROOT, "locales", file), "utf8");
      for (const key of MARKET_PUBLIC_COPY_KEYS) {
        const value = localeStringValue(src, key);
        for (const pattern of MARKET_JARGON_PATTERNS) {
          expect(value, `${file}.${key} must not match ${pattern}`).not.toMatch(pattern);
        }
      }
    }
  });
});

describe("announcements route metadata (PER CI-15)", () => {
  it("uses generateMetadata with locale-aware title (defaults zh)", () => {
    const page = readFileSync(join(__dirname, "../traveltrust/announcements/page.tsx"), "utf8");
    expect(page).toContain("generateMetadata");
    expect(page).toContain("localeMessagesFromAcceptLanguage");
    expect(page).not.toMatch(/title:\s*en\.traveltrust_announcements_title/);
    expect(zh.traveltrust_announcements_title).toBe("项目动态与公告");
  });
});
