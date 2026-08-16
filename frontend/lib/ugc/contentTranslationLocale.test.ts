import { describe, expect, it } from "vitest";
import { isUgcContentId, resolveContentTranslationLocale } from "./contentTranslationLocale";

describe("resolveContentTranslationLocale", () => {
  it("follows UI locale and clamps to zh|en", () => {
    expect(resolveContentTranslationLocale("en")).toBe("en");
    expect(resolveContentTranslationLocale("zh")).toBe("zh");
    expect(resolveContentTranslationLocale("ja")).toBe("zh");
  });
});

describe("isUgcContentId", () => {
  it("accepts UUID and rejects demo listing slugs", () => {
    expect(isUgcContentId("a1b2c3d4-e5f6-47a8-9abc-def012345678")).toBe(true);
    expect(isUgcContentId("m-seaside-suite")).toBe(false);
  });
});
