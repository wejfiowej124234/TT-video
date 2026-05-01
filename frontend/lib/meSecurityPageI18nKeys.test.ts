/**
 * `/me/security` 页 `me_security_page_*` 键在 zh/en 成对存在（与 `app/me/security/page.tsx` 对拍）。
 */
import { describe, it, expect } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";

/** 与 `app/me/security/page.tsx` 中 `t("…")` 调用同步维护 */
const ME_SECURITY_PAGE_I18N_KEYS = [
  "me_security_page_cell_placeholder",
  "me_security_page_load_failed",
  "me_security_page_revoke_current_confirm",
  "me_security_page_revoke_current_failed",
  "me_security_page_revoke_suffix_confirm",
  "me_security_page_revoke_suffix_failed",
  "me_security_page_export_notif_failed",
  "me_security_page_export_sessions_failed",
  "me_security_page_title",
  "me_security_page_refreshing",
  "me_security_page_refresh",
  "me_security_page_back_community",
  "me_security_page_section_sessions",
  "me_security_page_busy",
  "me_security_page_revoke_current",
  "me_security_page_export_sessions_json",
  "me_security_page_th_suffix",
  "me_security_page_th_current",
  "me_security_page_th_created",
  "me_security_page_th_last_seen",
  "me_security_page_th_status",
  "me_security_page_th_action",
  "me_security_page_yes_this_device",
  "me_security_page_no",
  "me_security_page_state_revoked",
  "me_security_page_state_active",
  "me_security_page_btn_current_session",
  "me_security_page_btn_revoke",
  "me_security_page_section_notifications",
  "me_security_page_aria_notif_status",
  "me_security_page_notif_all_statuses",
  "me_security_page_notif_event_placeholder",
  "me_security_page_aria_event_type",
  "me_security_page_aria_notif_limit",
  "me_security_page_notif_opt_20",
  "me_security_page_notif_opt_50",
  "me_security_page_notif_opt_100",
  "me_security_page_notif_opt_200",
  "me_security_page_notif_apply",
  "me_security_page_export_json",
  "me_security_page_only_failed",
  "me_security_page_only_password",
  "me_security_page_th_event",
  "me_security_page_th_template",
  "me_security_page_th_delivery_status",
  "me_security_page_th_attempts",
  "me_security_page_th_last_error",
  "me_security_page_th_created_at",
  "me_security_page_th_detail",
  "me_security_page_expand",
  "me_security_page_collapse",
] as const;

describe("me_security_page i18n keys", () => {
  it("zh and en define every key used by app/me/security/page.tsx", () => {
    const z = zh as Record<string, string>;
    const e = en as Record<string, string>;
    for (const k of ME_SECURITY_PAGE_I18N_KEYS) {
      expect(z[k]?.trim().length ?? 0, `zh missing or empty: ${k}`).toBeGreaterThan(0);
      expect(e[k]?.trim().length ?? 0, `en missing or empty: ${k}`).toBeGreaterThan(0);
    }
  });

  it("suffix confirm/fail templates include {{suffix}} for LocaleProvider interpolation", () => {
    const z = zh as Record<string, string>;
    const e = en as Record<string, string>;
    expect(z.me_security_page_revoke_suffix_confirm).toContain("{{suffix}}");
    expect(z.me_security_page_revoke_suffix_failed).toContain("{{suffix}}");
    expect(e.me_security_page_revoke_suffix_confirm).toContain("{{suffix}}");
    expect(e.me_security_page_revoke_suffix_failed).toContain("{{suffix}}");
  });
});
