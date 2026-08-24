import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { localeFromAcceptLanguage, localeMessagesFromAcceptLanguage } from "@/lib/pickMetadataLocale";
import { DEFAULT_LOCALE, LOCALES, LOCALE_STORAGE_KEY } from "@/lib/i18n";
import zh from "@/locales/zh";
import en from "@/locales/en";

describe("localeMessagesFromAcceptLanguage", () => {
  it("product default locale is English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALES[0]).toBe("en");
    expect(LOCALE_STORAGE_KEY).toBe("traveltrust_locale_v3");
    expect(localeFromAcceptLanguage(null)).toBe("en");
    const provider = readFileSync(join(process.cwd(), "components/LocaleProvider.tsx"), "utf8");
    expect(provider).not.toContain("navigator.language");
    expect(provider).toContain("getStoredLocale() ?? DEFAULT_LOCALE");
  });
  it("defaults to en for null/empty", () => {
    expect(localeMessagesFromAcceptLanguage(null)).toBe(en);
    expect(localeMessagesFromAcceptLanguage(undefined)).toBe(en);
    expect(localeMessagesFromAcceptLanguage("")).toBe(en);
    expect(localeMessagesFromAcceptLanguage("   ")).toBe(en);
  });

  it("prefers first matching tag in list", () => {
    expect(localeMessagesFromAcceptLanguage("en-US,zh-CN;q=0.8").didRank_meta_title).toBe(en.didRank_meta_title);
    expect(localeMessagesFromAcceptLanguage("zh-TW,en;q=0.9").didRank_meta_title).toBe(zh.didRank_meta_title);
  });

  it("handles q-values and spacing", () => {
    expect(localeMessagesFromAcceptLanguage(" en-GB ; q=0.9 ").didRank_meta_description).toBe(en.didRank_meta_description);
  });
});
