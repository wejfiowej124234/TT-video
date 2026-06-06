import { describe, expect, it } from "vitest";
import en from "@/locales/en";
import zh from "@/locales/zh";
import { applyLocalePlaceholders, type LocaleTranslateFn } from "@/lib/i18n";
import { mapApiReadError } from "./mapApiReadError";

const t = (k: string) => k;

describe("mapApiReadError · Retry-After & i18n", () => {
  it("appends Retry-After hint when Error.retryAfterSeconds is set (parseResponse 429)", () => {
    const e = new Error("delete_failed") as Error & { retryAfterSeconds?: number };
    e.retryAfterSeconds = 9;
    const out = mapApiReadError(e, t, "fb");
    expect(out.startsWith("community_api_msg_delete_failed")).toBe(true);
    expect(out).toContain("9");
    expect(out).toMatch(/\([0-9]+s\)$/);
  });

  it("appends localized Retry-After suffix with zh dict", () => {
    const dict = zh as Record<string, string>;
    const tZh: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    const e = new Error("comment_rate_limited") as Error & { retryAfterSeconds?: number };
    e.retryAfterSeconds = 20;
    const out = mapApiReadError(e, tZh, "fb");
    expect(out).toContain(dict.community_api_msg_comment_rate_limited);
    expect(out).toContain("20");
    expect(out).toMatch(/秒后再试/);
  });

  it("localizes internal_api_forbidden with zh dict (A5/A6 · ①②③ 同码)", () => {
    const dict = zh as Record<string, string>;
    const tZh: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    expect(mapApiReadError(new Error("internal_api_forbidden"), tZh, "fb")).toBe(
      dict.common_error_internalApiForbidden
    );
  });

  it("localizes internal_api_forbidden with en dict (zh/en parity)", () => {
    const dict = en as Record<string, string>;
    const tEn: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    expect(mapApiReadError(new Error("internal_api_forbidden"), tEn, "fb")).toBe(
      dict.common_error_internalApiForbidden
    );
  });
});
