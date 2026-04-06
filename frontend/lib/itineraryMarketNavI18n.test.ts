/** 07 §5.2 / §5.2A：行程页与市场页脚 nav aria（zh/en） */
import { describe, expect, it } from "vitest";
import en from "@/locales/en";
import zh from "@/locales/zh";

const KEYS = [
  "itin_relatedNav_aria",
  "market_footer_nav_aria",
  "market_relatedNav_aria",
  "orders_new_relatedNav_aria",
  "guides_relatedNav_aria",
  "guide_register_relatedNav_aria",
  "escrow_detail_relatedNav_aria",
  "disputes_relatedNav_aria",
  "dispute_detail_relatedNav_aria",
  "orders_list_relatedNav_aria",
  "did_rank_relatedNav_aria",
  "governance_subpage_relatedNav_aria",
  "staking_relatedNav_aria",
  "me_relatedNav_aria",
  "guide_dashboard_relatedNav_aria",
  "me_password_relatedNav_aria",
  "auth_shell_relatedNav_aria",
  "rate_relatedNav_aria",
  "guide_detail_relatedNav_aria",
  "app_error_relatedNav_aria",
  "notFound_relatedNav_aria",
  "help_relatedNav_aria",
  "empty_state_relatedNav_aria",
  "landing_relatedNav_aria",
  "community_relatedNav_aria",
] as const;

describe("product cross-nav & market footer i18n (07 §5.2 / §5.2A)", () => {
  it.each([
    { locale: "zh", dict: zh as Record<string, string> },
    { locale: "en", dict: en as Record<string, string> },
  ] as const)("keys present (%s)", ({ locale, dict }) => {
    for (const key of KEYS) {
      const v = dict[key];
      expect(v, `${locale}: ${key}`).toBeTruthy();
      expect(String(v).trim().length, `${locale}: ${key}`).toBeGreaterThan(0);
    }
  });
});
