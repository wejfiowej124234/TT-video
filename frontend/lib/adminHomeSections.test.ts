/**
 * 70 / 07 §5.6C：`AdminHomeClient` 分组标题与 `AdminShellBar` 文案键（zh/en）。
 */
import { describe, expect, it } from "vitest";
import en from "@/locales/en";
import zh from "@/locales/zh";

const KEYS = [
  "admin_home_section_ops_planes",
  "admin_home_section_core",
  "admin_home_section_audit_finance",
  "admin_home_section_community",
  "admin_home_section_platform",
  "admin_shell_bar_aria",
  "admin_shell_nav_workspace",
  "admin_shell_nav_site",
] as const;

describe("adminHomeSections i18n", () => {
  it.each([
    { locale: "zh", dict: zh as Record<string, string> },
    { locale: "en", dict: en as Record<string, string> },
  ] as const)("non-empty admin section & shell strings (%s)", ({ locale, dict }) => {
    for (const key of KEYS) {
      const v = dict[key];
      expect(v, `${locale}: missing ${key}`).toBeTruthy();
      expect(String(v).trim().length, `${locale}: empty ${key}`).toBeGreaterThan(0);
    }
  });
});
