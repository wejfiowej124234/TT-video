/**
 * `/me/password` 页所用 `t("…")` 键在 zh/en 成对存在（与 `app/me/password/page.tsx`、`loading.tsx` 对拍）。
 */
import { describe, it, expect } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";

const ME_PASSWORD_PAGE_I18N_KEYS = [
  "mePassword_mismatch",
  "mePassword_required",
  "mePassword_tooShort",
  "mePassword_failed",
  "mePassword_title",
  "mePassword_subtitle",
  "mePassword_successMessage",
  "mePassword_goLogin",
  "mePassword_backSettings",
  "mePassword_currentPassword",
  "mePassword_currentPlaceholder",
  "mePassword_newPassword",
  "mePassword_newPlaceholder",
  "mePassword_confirmPassword",
  "mePassword_confirmPlaceholder",
  "mePassword_forgotLink",
  "mePassword_hintMin",
  "common_submitting",
  "mePassword_submit",
  "mePassword_cancel",
  "me_settings_eyebrow",
  "auth_login_passwordShow",
  "auth_login_passwordHide",
] as const;

describe("me_password page i18n keys", () => {
  it("zh and en define every key used by app/me/password/page.tsx and loading.tsx", () => {
    const z = zh as Record<string, string>;
    const e = en as Record<string, string>;
    for (const k of ME_PASSWORD_PAGE_I18N_KEYS) {
      expect(z[k]?.trim().length ?? 0, `zh missing or empty: ${k}`).toBeGreaterThan(0);
      expect(e[k]?.trim().length ?? 0, `en missing or empty: ${k}`).toBeGreaterThan(0);
    }
  });

  it("mePassword_tooShort includes {{n}} for LocaleProvider interpolation", () => {
    const z = zh as Record<string, string>;
    const e = en as Record<string, string>;
    expect(z.mePassword_tooShort).toContain("{{n}}");
    expect(e.mePassword_tooShort).toContain("{{n}}");
  });

  it("product copy does not expose chain_off in password strings", () => {
    const z = zh as Record<string, string>;
    const e = en as Record<string, string>;
    for (const k of ME_PASSWORD_PAGE_I18N_KEYS) {
      expect(z[k] ?? "", `zh ${k}`).not.toMatch(/chain_off/i);
      expect(e[k] ?? "", `en ${k}`).not.toMatch(/chain_off/i);
    }
  });
});
