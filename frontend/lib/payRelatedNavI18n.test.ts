/** 07 §5.1：`/pay` 相关导航 aria 文案（zh/en） */
import { describe, expect, it } from "vitest";
import en from "@/locales/en";
import zh from "@/locales/zh";

describe("payRelatedNav i18n", () => {
  it.each([
    { locale: "zh", dict: zh as Record<string, string> },
    { locale: "en", dict: en as Record<string, string> },
  ] as const)("pay_relatedNav_aria present (%s)", ({ locale, dict }) => {
    const v = dict.pay_relatedNav_aria;
    expect(v, locale).toBeTruthy();
    expect(String(v).trim().length, locale).toBeGreaterThan(0);
  });
});
