import { describe, expect, it } from "vitest";
import { localeMessagesFromAcceptLanguage } from "@/lib/pickMetadataLocale";
import zh from "@/locales/zh";
import en from "@/locales/en";

describe("localeMessagesFromAcceptLanguage", () => {
  it("defaults to zh for null/empty", () => {
    expect(localeMessagesFromAcceptLanguage(null)).toBe(zh);
    expect(localeMessagesFromAcceptLanguage(undefined)).toBe(zh);
    expect(localeMessagesFromAcceptLanguage("")).toBe(zh);
    expect(localeMessagesFromAcceptLanguage("   ")).toBe(zh);
  });

  it("prefers first matching tag in list", () => {
    expect(localeMessagesFromAcceptLanguage("en-US,zh-CN;q=0.8").didRank_meta_title).toBe(en.didRank_meta_title);
    expect(localeMessagesFromAcceptLanguage("zh-TW,en;q=0.9").didRank_meta_title).toBe(zh.didRank_meta_title);
  });

  it("handles q-values and spacing", () => {
    expect(localeMessagesFromAcceptLanguage(" en-GB ; q=0.9 ").didRank_meta_description).toBe(en.didRank_meta_description);
  });
});
